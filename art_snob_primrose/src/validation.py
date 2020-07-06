import pandas as pd
import logging


class ValidatedDataFrame(object):
    """Helper method to have a type validated dataframe for node input"""

    def validate(self, data: pd.DataFrame, verbose: bool = False) -> bool:
        """Check if data columns match the input columns and optionally, types """
        verbose=True
        if not hasattr(self, 'columns'):
            raise Exception("ValidateDataFrame classes need a 'columns' class variable as list of column names.")

        if not hasattr(self, 'types'):
            types = None
        else:
            types = self.types

        if len(set(self.columns) - set(data.columns)) > 0:

            if verbose:
                logging.warning(f"Column validation failed, need columns: {set(self.columns) - set(data.columns)}")

            return False

        else:

            if types is not None:

                for ty, col in zip(types, self.columns):

                    if data[col].dtype != ty:
                        if verbose:
                            logging.warning(
                                f"Type validation failed, {col} looking for {ty} but is type {data[col].dtype}")
                        return False

            return True