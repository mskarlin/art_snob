import logging
import json
import math
import os
import sys
import google.cloud.logging
from google.cloud.logging.handlers import ContainerEngineHandler


class StructuredStackdriverHandler(ContainerEngineHandler):
    """Extend the ContainerEngineHandler to add additional fields
    """

    def __init__(self, additional_fields):
        super(StructuredStackdriverHandler, self).__init__()
        self.additional_fields = additional_fields

    def _format_stackdriver_json(self, record, message):
        """Helper to format a LogRecord in in Stackdriver fluentd format.
            :rtype: str
            :returns: JSON str to be written to the log file.
        """
        subsecond, second = math.modf(record.created)

        payload = {
            "message": message,
            "timestamp": {"seconds": int(second), "nanos": int(subsecond * 1e9)},
            "thread": record.thread,
            "severity": record.levelname,
        }

        for field in self.additional_fields:
            value = record.__dict__.get(field, None)
            if value:
                payload[field] = value

        return json.dumps(payload)

    def format(self, record: logging.LogRecord):
        message = super(ContainerEngineHandler, self).format(record)
        return self._format_stackdriver_json(record, message)


class StreamToLogger(object):
    """
    Fake file-like stream object that redirects writes to a logger instance.
    """

    def __init__(self, logger, log_level=logging.INFO):
        self.logger = logger
        self.log_level = log_level
        self.linebuf = ""

    def write(self, buf):
        for line in buf.rstrip().splitlines():
            self.logger.log(self.log_level, line.rstrip())

    def flush(self):
        pass


def setup_logging(
        use_stackdriver,
        structured_fields=["name", "filename", "funcName"],
        local_fmt="%(levelname)s:%(name)s:%(message)s",
        log_level=logging.INFO,
        redirect_stdout=False,
        project=None
):
    """Sets up root logger with given log_fmt and logging level. Also redirects stdout to logger.

    Args:
            stackdriver_mode: boolean to set up local logging or stackdriver logging
            structured_fields: if using stackdriver logging, which fields to use in structured logging
            local_fmt: format to use for local logging
            log_level: the logging level for the root logger

    """
    # Setup google cloud logging if not local.
    # Might be able to check based on the client/handler calls instead of this boolean.
    if use_stackdriver:
        logging.basicConfig(level=log_level)
        logging.info("Running on cloud mode, setting up logging...")
        client = google.cloud.logging.Client(project=project)
        handler = client.get_default_handler()
        # check we have structured fields and can use our custom handler
        if structured_fields and isinstance(handler, ContainerEngineHandler):
            handler = StructuredStackdriverHandler(structured_fields)
        logging.getLogger().handlers = []
        logging.getLogger().addHandler(handler)
        # # redirect stdout logger at info level
        if redirect_stdout:
            sl_stdout = StreamToLogger(logging.getLogger(), log_level=logging.INFO)
            sys.stdout = sl_stdout
    # basic configuration if local
    else:
        logging.basicConfig(format=local_fmt, level=log_level)
        logging.info("Logging in local mode")

    return None


# from https://stackoverflow.com/questions/11130156/suppress-stdout-stderr-print-from-python-functions
# This is needed if you run pytest with the '-s' flag
# or else it prints every training iteration during fit (very long stdout)
class suppress_stdout_stderr(object):
    """
    A context manager for doing a "deep suppression" of stdout and stderr in
    Python, i.e. will suppress all print, even if the print originates in a
    compiled C/Fortran sub-function.
       This will not suppress raised exceptions, since exceptions are printed
    to stderr just before a script exits, and after the context manager has
    exited (at least, I think that is why it lets exceptions through).

    """

    def __init__(self):
        # Open a pair of null files
        self.null_fds = [os.open(os.devnull, os.O_RDWR) for x in range(2)]
        # Save the actual stdout (1) and stderr (2) file descriptors.
        self.save_fds = (os.dup(1), os.dup(2))

    def __enter__(self):
        # Assign the null pointers to stdout and stderr.
        os.dup2(self.null_fds[0], 1)
        os.dup2(self.null_fds[1], 2)

    def __exit__(self, *_):
        # Re-assign the real stdout/stderr back to (1) and (2)
        os.dup2(self.save_fds[0], 1)
        os.dup2(self.save_fds[1], 2)
        # Close the null files
        os.close(self.null_fds[0])
        os.close(self.null_fds[1])