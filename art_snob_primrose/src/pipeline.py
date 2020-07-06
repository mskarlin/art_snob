"""Module with abstract pipeline class to specify interface needed for future pipelines

Author(s):
    Michael Skarlinski (michael.skarlinski@weightwatchers.com)

"""

from abc import ABC, abstractmethod
from enum import Enum
from typing import List, Callable
from src.auto_node import AutoNode
import logging
from primrose.base.transformer_sequence import TransformerSequence
from src.auto_node import TypeCheckBeforeNone


class PipelineModeType(Enum):
    """Mode when performing the pipeline

    Note:
        FIT = fit data to transformer object only
        TRANSFORM = transform data only from (previously) fit transformers in a pipeline
        FIT_TRANSFORM = fit data then transform data in a pipeline

    """
    FIT = "FIT"
    FIT_TRANSFORM = "FIT_TRANSFORM"
    TRANSFORM = "TRANSFORM"

    @staticmethod
    def names():
        """list of all the names in the enum

        Returns:
            list of Enum's names

        """
        return list(map(lambda t: t.name, PipelineModeType))

    @staticmethod
    def values():
        """list of the enum's values

        Returns:
            list of (value, PipelineModeType) pairs

        """
        return list(map(lambda t: t.value, PipelineModeType))


class AutoAbstractPipeline(AutoNode):
    """Pipeline class should have a defined pipeline that it executes and the ability to transform raw data"""

    def __init__(self, configuration=None, instance_name=None):
        """Clean/transform/filter data in memory after de-serializing from a reader object

        Args:
            configuration: configuration class specified in src/configuration
            instance_name: name used to find this specific instance's configuration

        """
        super(AutoAbstractPipeline, self).__init__(configuration, instance_name)
        self.transformer_sequence = None
        self.data = None

    def generate_execute_functions(self, transformer_sequence: TransformerSequence = TypeCheckBeforeNone,
                                   is_training: bool = False) -> List[Callable]:
        """Examine the upstream data_object for any TransformerSequence and run in the correct mode

        if not found, then initialize a new TransformerSequence

         Args:
            transformer_sequence: (pre-trained) upstream transformer sequence object which can be used
            is_training: flag to run a full fit-transform (True) or just a transform (False)

        Returns:
            Nothing, sets the transformer sequence

        """
        if not is_training:
            logging.info('"is_training" key not found in the node_config, assuming production data')

        execute_funcs = []

        if transformer_sequence:

            self.transformer_sequence = transformer_sequence

        else:

            # no upstream transformer exists, time to build it here
            execute_funcs.append(self.init_pipeline)

        if is_training:
            execute_funcs.append(self.fit)

        execute_funcs.append(self.transform)

        execute_funcs.append(self.final_callback)

        return execute_funcs

    @staticmethod
    def necessary_config(node_config):
        """Return a list of necessary configuration keys within the implementation

        Args:
            node_config (dict): set of parameters / attributes for the node

        After adding this list, validation automatically occurs before instantiation in the pipeline factory.

        Returns:
            set of keys necessary to run implementation

        """
        return set(['is_training']) # pragma: no cover

    def fit(self):
        """Clean/transform or filter data using a pipeline of functions

        The method should also cache results and report on sizing for debugging. fit_transform must store the
        information necessary for data transformations on test data, so any encodings or model-based imputations must be
        cached in this method, to be called when the transform method is used.

        Args:
            data_object (DataObject): DataObject instance

        Returns:
            data_object (DataObject): DataObject instance

        """
        pass  # pragma: no cover

    @abstractmethod
    def transform(self):
        """Clean/transform or filter data using a pipeline of functions and any cached objects from fit_transform

        The method should cache post-transform results and report on sizing for debugging. tranform uses the cached
        objects scored in the fit_tranform call to transform data. It's likely to be used for live predictions or
        test (hold-out) data.

        Args:
            data_object (DataObject): DataObject instance

        Returns:
            data_object (DataObject)

        """
        pass  # pragma: no cover

    def init_pipeline(self):
        """Initialize the transformer_sequence class object, only if no upstream transformer is found

        Returns:
            side effect is that the transformer_sequence object is set
            (optional) anything returned here will automatically be added to the data object, remember to
                return a dict keyed to the name of interest

        """
        self.transformer_sequence = TransformerSequence()

    def final_callback(self):
        """Called after all fits and transformations, give the user the chance to return segments to save"""
        pass

    def execute_pipeline(self, input_, mode):
        """Run a TransformerSequence of functions with chained input and output data

        Args:
            input_ (object): input data (usually a pandas dataframe)
            mode: enum object for fit, transform, or fit_transform

        Returns:
            transformed data (usually a pandas dataframe) after running through all functions in the pipeline

        """
        if not self.transformer_sequence:
            raise Exception("run() must be called to extract/create a TransformerSequence")

        if mode not in PipelineModeType.names() and mode not in PipelineModeType:
            raise Exception('mode must be of type PipelineModeType Enum object.')

        for transformer in self.transformer_sequence.transformers():

            if mode == PipelineModeType.FIT:

                transformer.fit(input_)

            elif mode == PipelineModeType.TRANSFORM:

                input_ = transformer.transform(input_)

            elif mode == PipelineModeType.FIT_TRANSFORM:

                input_ = transformer.fit_transform(input_)

        return input_
