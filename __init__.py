import json
import os
import psutil
from notebook.base.handlers import IPythonHandler
from notebook.utils import url_path_join
from tornado import web
import datetime
from resource import getrusage, RUSAGE_SELF


BYTES_IN_GIG = 1073741824.0


class EchoHandler(IPythonHandler):

    def __init__(self, *args, **kwargs):
        IPythonHandler.__init__(self, *args, **kwargs)
        self.memory_limit = EchoHandler.get_memory_limit()

    @web.authenticated
    async def get(self):
        def date_handler(o):
            if isinstance(o, datetime.datetime):
                return o.__str__()

        response = {}
        response['date'] = datetime.datetime.now()
        response['memory_used'] = EchoHandler.get_memory_used()
        response['get_memory_limit'] = self.memory_limit
        response['percent_in_usage'] = response["memory_used"] / \
            response["get_memory_limit"]
        self.set_status(200)
        self.set_header('Content-Type', 'application/json')
        self.write(json.dumps(response, default=date_handler))

    # I thought I might be able to leverage getrusage(RUSAGE_SELF)
    # https://github.com/celery/billiard/blob/bf04adff8f8477cd7758c7f31325fbdeae7774e3/billiard/compat.py
    # But it didn't seem to represent the Memory as I thought it would.
    # Maybe worth another look.
    @staticmethod
    def get_memory_used():
        if "MEM_LIMIT" in os.environ:
            cur_process = psutil.Process()
            all_processes = [cur_process] + \
                cur_process.children(recursive=True)
            limits = {}

            # Get memory information
            rss = sum([p.memory_info().rss for p in all_processes])
            return rss
        else:
            available = psutil.virtual_memory().total - psutil.virtual_memory().available
            return float("%.1f" % (available / BYTES_IN_GIG))

    '''
    Max Memory is needed to determine how close the notebook is to running
    out of memory.
    '''
    @staticmethod
    def get_memory_limit():
        mem_limit = 0
        if "MEM_LIMIT" in os.environ:
            mem_limit = os.environ.get('MEM_LIMIT')
        else:
            mem_limit = float("%.1f" %
                              (psutil.virtual_memory().total / BYTES_IN_GIG))
        return mem_limit


def _jupyter_server_extension_paths():
    return [{
        "module": "memory_monitor"
    }]


def _jupyter_nbextension_paths():
    return [dict(
        section="notebook",
        # the path is relative to the `memory_directory` directory
        src="static",
        # directory in the `nbextension/` namespace
        dest="memory_monitor",
        # _also_ in the `nbextension/` namespace
        require="memory_monitor/main")]


def load_jupyter_server_extension(nbapp):
    nbapp.log.info("My module enabled!")
    """
    Called during notebook start
    """
    route_pattern = url_path_join(
        nbapp.web_app.settings['base_url'], '/echo')
    nbapp.web_app.add_handlers('.*', [(route_pattern, EchoHandler)])
