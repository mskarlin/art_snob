'''
    Run a job: i.e. run a configuration file through the DAGRunner
'''
import argparse
import logging
from distutils.util import strtobool

import sys
sys.path.append('../')
import os
import warnings

######################################
######################################
# Important:
#
# If your configuration uses custom node classes, be sure to set environment variable
# PRIMROSE_EXT_NODE_PACKAGE to the location of your package before running primrose.
# Example:
from src.__init__ import *
#   export PRIMROSE_EXT_NODE_PACKAGE=./src
#   python run_primrose.py --config_loc my_config.json
#   ```
#
######################################
######################################

from primrose.configuration.configuration import Configuration
from primrose.dag_runner import DagRunner
from primrose.dag.config_layer_traverser import ConfigLayerTraverser
from primrose.dag.depth_first_traverser import DepthFirstTraverser
from utilities.custom_logging import setup_logging


warnings.filterwarnings("ignore")


def parse_arguments():
    """
        Parse command line arguments

        Returns:
            argument objects with flags as attributes
    """
    parser = argparse.ArgumentParser()
    parser.add_argument('--config_loc',
                        help='Location of the configuration file',
                        required=False)
    parser.add_argument('--project',
                        help='default gcs project',
                        required=False)
    parser.add_argument('--is_dry_run',
                        help='do a dry run of the DAG which will validatre config and log which nodes would be run',
                        default=False,
                        type=lambda x: (str(x).lower() == 'true'))
    parser.add_argument('--use_stackdriver_logging',
                        type=lambda x: bool(strtobool(x)),
                        help="flag to use local or stackdriver logging configuration",
                        default=False,
                        const=True,
                        nargs="?")

    known_args, pipeline_args = parser.parse_known_args()
    return known_args, pipeline_args


def main():
    """
        Run a job: i.e. run a configuration file through the DAGRunner
    """

    os.environ['PRIMROSE_EXT_NODE_PACKAGE'] = "./src"

    args, _ = parse_arguments()

    setup_logging(args.use_stackdriver_logging, project=args.project)

    config_file = os.environ.get("CONFIG") if os.environ.get("CONFIG") else args.config_loc

    configuration = Configuration(config_location=config_file)

    DagRunner(configuration).run(dry_run=args.is_dry_run)

if __name__ == '__main__':
    main()
