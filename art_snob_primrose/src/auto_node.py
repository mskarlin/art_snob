import inspect
import logging
import pandas as pd
from typing import List, Dict, Tuple, Any, Type, Callable

from primrose.data_object import DataObject
from primrose.base.node import AbstractNode
from primrose.data_object import DataObjectResponseType as dort
from src.validation import ValidatedDataFrame

class IterableCombineError(Exception):
    """Exception for failed attempts at combining data types from an iterable object"""
    pass


class TypeCheckBeforeNoneClass(object):

    # just in-case python2
    def __nonzero__(self):
        return False

    def __bool__(self):
        return False


# Used when specifying that a param defualt should do a full type check of upstream nodes data before using default val
TypeCheckBeforeNone = TypeCheckBeforeNoneClass()


class AutoNode(AbstractNode):
    """Node to automatically gather upstream data and insert into an 'execute' method where rules apply

    Notes:
        Rules are as follows:
            1. matching configuration names (warning if types mismatch and annotations are present)
            2. matching upstream key names (warning if types mismatch and annotations are present)
            3. matching from upstream data based on type (only when annotations are present)

        ! When using annotations, nested data types will not work because of python's isinstance !
        ! implementation, preventing us to have valid comparisons for complex types.             !

    """

    def __init__(self, configuration=None, instance_name=None):
        """Instantiate the standard AbstractNode methods

        Notes:
            Sets the strict_types instance variable, which will raise exceptions if names match, even
            when the names match correctly. Can be set to true in inherited instances.

        """
        if configuration is not None and instance_name is not None:
            super(AutoNode, self).__init__(configuration, instance_name)
        self.strict_types = False

    @staticmethod
    def necessary_config(node_config):
        return {}

    @staticmethod
    def _type_check(variable: Any, param: inspect.Parameter, warn: bool = True) -> bool:
        """Check types from a param object, with an optional warning raised to user

        Args:
            variable: valid python object
            param: callable parameter from inspect signature
            warn: flag to warn user

        Returns:
            flag for passing type check (True) or failing (False)

        """

        # special case for Any, which raises an isinstance exception
        if param.annotation == Any:
            return True

        # special case for when a ValidatedDataFrame is being tested against a dataframe
        try:
            mro = inspect.getmro(param.annotation)
        except AttributeError:
            mro = {}

        if ValidatedDataFrame in mro and isinstance(variable, pd.DataFrame):
            return param.annotation.validate(param.annotation, variable, warn)

        if isinstance(variable, param.annotation):
            return True
        else:
            if warn:
                logging.warning(f"Configuration type {type(variable)} does not"
                                f"match {param.annotation}")
            return False

    def _flat_upstream_data(self, data_object: DataObject) -> Tuple[Dict, Dict]:
        """Remove the first level source key and cluster duplicate keys into two data objects

        Args:
            data_object: object containing all upstream data as well as the configuration context

        Returns:
            Tuple of single_key_data (all data keyed without duplicates) and
            duplicate_key_data (all data keyed in lists under the duplicate keys)

        """
        try:
            upstream_data = data_object.get_upstream_data(self.instance_name, rtype=dort.INSTANCE_KEY_VALUE.value)

        except:
            logging.info('No upstream data found, continuing using only config inputs...')
            return {}, {}

        single_key_data = {}
        duplicate_key_data = {}

        # split into non-duplicate keys and duplicate keys
        for upstream_loc, data in upstream_data.items():

            for key, value in data.items():

                if key in duplicate_key_data:

                    duplicate_key_data[key].append(value)

                elif key in single_key_data:

                    prev_value = single_key_data[key]

                    del single_key_data[key]

                    duplicate_key_data[key] = [prev_value, value]

                else:

                    single_key_data[key] = value

        return single_key_data, duplicate_key_data

    @staticmethod
    def combine_data(sources: List[Any], target_type: Any, verbose: bool = False) -> Any:
        """Combine data into iterable objects using hard-coded logic

        Users can overwrite this method for any custom combining needed

        Notes:
            1. If source types differ: raise error

            2. Logic as follows...
                Source types -> target types
                List -> List (concatenated)
                Dict -> List (list of dicts)
                DataFrame -> List (list of DataFrames)
                DataFrame -> DataFrame (concatenated)
                Dict -> Dict (unioned dicts)

        Args:
            sources: List of the upstream data to be combined into a single type
            target_type: type to compare the sources against
            verbose: flag to display conversions

        Returns:
            combined object in the type requested in target_type

        """

        source_type = type(sources[0])

        if not all([type(s) == source_type for s in sources]):
            raise TypeError(f"Multiple overlapping (same name) upstream data must have the same type,"
                            f"got {[type(s) for s in sources]} but expected only {source_type}.")

        if source_type == list and target_type == List:

            if verbose:
                logging.info(f"Concatenating multiple upstream list into list for input")

            combined = []

            for sl in sources:
                combined += sl

            return combined

        elif source_type == dict and target_type == List:

            if verbose:
                logging.info(f"Combining multiple upstream dicts into list for input")

            return sources

        elif source_type == pd.DataFrame and target_type == List:

            if verbose:
                logging.info(f"Combining multiple upstream DataFrames into list for input")

            return sources

        elif source_type == pd.DataFrame and target_type == pd.DataFrame:

            if verbose:
                logging.info(f"Concatenating multiple upstream DataFrames into DataFrame for input")

            try:
                return pd.concat(sources)

            except Exception as e:
                raise IterableCombineError("Problem concatenating upstream dataframes into a single dataframe.")

        elif source_type == dict and target_type == Dict:

            if verbose:
                logging.info(f"Updating multiple upstream dicts into dict for input")

            combined = sources[0]

            for s in sources[1:]:
                combined.update(s)

            return combined

        else:

            raise IterableCombineError(f"No conversion rule exists for combining multiple upstream {source_type}"
                                       f"into {target_type}")

    def _type_check_within_key_data(self, single_key_data: Dict, duplicate_key_data: Dict, param: inspect.Parameter,
                                    curr_already_assigned: List) -> Tuple[Any, List]:
        """Check if a type exists within each un-assigned data object, return that object if so

        Args:
            single_key_data: key names keyed to data objects
            duplicate_key_data: duplicated keys with lists of data objects
            param: value to check against
            curr_already_assigned: list of keys that have been assigned to inputs

        Returns:
            Tuple of object that matches type (or None) along with the updated list of already_assigned keys

        """

        already_assigned = curr_already_assigned.copy()

        for k, v in single_key_data.items():

            if self._type_check(v, param, warn=False) and k not in already_assigned:
                already_assigned.append(k)

                logging.warning(f"Assigning data_object: {k} to input param: {param.name} because "
                                f"of matching expected types. (no name match found)")

                return v, already_assigned

        for k, v in duplicate_key_data.items():

            try:
                converted_data = self.combine_data(v, param.annotation)

            except IterableCombineError:
                continue

            if k not in already_assigned:
                already_assigned.append(k)

                logging.warning(f"Assigning data_object: {k} to input param: {param.name} because "
                                f"of matching expected types. (no name match found)")

                return converted_data, already_assigned

        return None, already_assigned

    def generate_execute_functions(self) -> List[Callable]:
        """Allow dynamic method choice(s) for the execute method at runtime

        This function can be implemented to produce custom classes like a pipeline or model
        instance which would need different executions depending on mode. Implementations
        may need to run sequential execute methods, which this method allows for.

        For example, a self.node_config param can assign a choice of execute methods
        implemented by the user.

        """
        return [self.execute]

    def assign_variables_for_func_execution(self, func: Callable,
                                            single_key_data: Dict,
                                            duplicate_key_data: Dict) -> Any:
        """Assign the correct upstream or configuration variables for the input func

        Args:
            func: function to map inputs and evaluate
            single_key_data: upstream data which has a single key name
            duplicate_key_data: lists of upstream data which correspond to the same key names

        Returns:
            (dict preferred) Any output data from the func, if a dict, they it's keyed
            to the future data_object names.

        """

        sig = inspect.signature(func)

        inputs = {}
        already_assigned = []

        for param in sig.parameters:

            param = sig.parameters[param]

            # check if the param name is present in the node_config
            if param.name in self.node_config:
                inputs[param.name] = self.node_config[param.name]
                right_type = self._type_check(self.node_config[param.name], param, warn=True)
                if self.strict_types and not right_type:
                    raise Exception(f'Parameter name match: {param.name}, but invalid types with strict_types=True')
                already_assigned.append(param.name)

            # check if the param name is in the data object
            elif param.name in single_key_data:
                inputs[param.name] = single_key_data[param.name]
                right_type = self._type_check(single_key_data[param.name], param, warn=True)
                if self.strict_types and not right_type:
                    raise Exception(f'Parameter name match: {param.name}, but invalid types with strict_types=True')
                already_assigned.append(param.name)

            # check if the param name exists in the duplicated keys
            elif param.name in duplicate_key_data:

                # convert the duplicate data into the right type for the annotation
                converted_data = self.combine_data(duplicate_key_data[param.name],
                                                   param.annotation,
                                                   verbose=True)
                inputs[param.name] = converted_data
                already_assigned.append(param.name)

            # if there's no name match, but a default exists (non TypeCheckBeforeNoneClass object), then use it
            elif (param.default != inspect._empty) and (not isinstance(param.default, TypeCheckBeforeNoneClass)):

                inputs[param.name] = param.default
                already_assigned.append(param.name)

            # special case to catch 'Any' types being specified
            elif param.annotation == Any:

                # first check the single keyed data object
                for key in single_key_data:

                    if key not in already_assigned:
                        inputs[param.name] = single_key_data[key]
                        already_assigned.append(key)
                        logging.warning(f"Assigning key {key} to param: {param.name} as an 'Any'"
                                        f"type match without a name match.")
                        break

                # we skip the duplicate key data, since we don't know what object
                # to convert our list of data into

            # check across all the data types for a matching non-assigned value
            elif self._type_check_within_key_data(single_key_data, duplicate_key_data, param, already_assigned)[0] \
                    is not None:

                inp_data, already_assigned = self._type_check_within_key_data(single_key_data,
                                                                              duplicate_key_data,
                                                                              param,
                                                                              already_assigned)

                inputs[param.name] = inp_data

            elif param.default == inspect._empty:
                raise Exception(f"No name-based, type-based matches, or defaults could be found for param"
                                f" {param.name} and type {param.annotation}")

            # last chance to use defaults when user annotated type IS TypeCheckBeforeNoneClass
            elif isinstance(param.default, TypeCheckBeforeNoneClass):
                inputs[param.name] = None
                already_assigned.append(param.name)

        return func(**inputs)

    def run(self, data_object: DataObject) -> Tuple[DataObject, bool]:
        """Break open data_object and find best match inputs for the execute function
            then, run the execute and terminate methods before adding output into the
            data_object

        Args:
            data_object: Primrose data object with all upstream data and configuration context

        Returns:
            data_object with execute's output added along with a terminate flag

        """

        single_key_data, duplicate_key_data = self._flat_upstream_data(data_object)

        execute_funcs = self.assign_variables_for_func_execution(self.generate_execute_functions,
                                                                 single_key_data,
                                                                 duplicate_key_data)

        for execute_func in execute_funcs:

            data = self.assign_variables_for_func_execution(execute_func,
                                                            single_key_data,
                                                            duplicate_key_data)

            # add to the data object using the names specified by the user
            if isinstance(data, dict):

                for name, d in data.items():
                    data_object.add(self, d, name)

            # if it's not a dict, we can just give it an arbitrary name
            elif data is not None:

                func_name = str(execute_func).split(' ')[1]
                data_object.add(self, data, f"data_{func_name}_{self.instance_name}")

        return data_object, self.terminate()

    def execute(self):
        """User specified method for data processing, which takes in an arbitrary number
            of arguments (with types). The types are used to understand the input options

        Returns:
            should always return a dict keyed to the desired downstream names of the objects

        """
        return {'output': None}

    def terminate(self):
        """User specified function to determine if this node should terminate or not"""
        return False