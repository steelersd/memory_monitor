// https://github.com/jupyter/notebook/blob/b8b66332e2023e83d2ee04f83d8814f567e01a4e/notebook/tests/services/kernel.js
define(["base/js/namespace", "base/js/events", "base/js/utils", "require", "./utils"], function(
  Jupyter,
  events,
  utils,
  require,
  memUtils
) {
  var params = {
    use_large_progress: false,
    poll_interval: 2,
    warn_threshold: 65,
    danger_threshold: 70,
    kernel_restart_threshold: 95,
    console_log_data: false
  };

  // Updates default params with any specified in the server's config
  conf = $.extend(true, params, Jupyter.notebook.config.data.memorymonitor);
  conf.progressSize = conf.use_large_progress ? "lg" : "sm";

  // Restrict values between 1 and 5
  conf.poll_interval = Jupyter.notebook.config.data.memorymonitor.poll_interval =
    conf.poll_interval < 1 ? 1 : Math.min(conf.poll_interval, 5);

  let onDataHandler = conf => {
    $(`#nb-memory-usage-${conf.progressSize}`).on("memory-data", function(data, memoryData) {
      conf.use_large_progress ? updateProgressLg(memoryData) : updateProgressSm(memoryData);
      updateProgressColor(memoryData, conf);
      interruptKernel(memoryData, conf);
    });
  };

  let doubleClickHandlerProgress = conf => {
    $(".mem-mon-container").dblclick(function() {
      $(`#nb-memory-usage-${conf.progressSize}`).hide();
      conf.use_large_progress = !conf.use_large_progress;
      conf.progressSize = conf.use_large_progress ? "lg" : "sm";
      $(`#nb-memory-usage-${conf.progressSize}`).show();
      onDataHandler(conf);
    });
  };

  let getAndHandleData = async () => {
    const response = await fetch(`${utils.get_body_data("baseUrl")}echo`);
    data = await response.json();
    $(`#nb-memory-usage-${conf.progressSize}`).trigger("memory-data", data);
    conf.console_log_data && console.log(data);
  };

  let updateProgressLg = memoryData => {
    percent_in_usage = Math.floor(memoryData.percent_in_usage * 100);
    $(`#nb-memory-usage-${conf.progressSize} .nb-memory-usage-progress`)
      .css("width", percent_in_usage + "%")
      .attr("aria-valuenow", percent_in_usage)
      .text(percent_in_usage + "% Used");
  };

  let updateProgressSm = memoryData => {
    percent_in_usage = Math.floor(memoryData.percent_in_usage * 100);
    $(`#nb-memory-usage-${conf.progressSize} .nb-memory-usage-progress`)
      .css("width", percent_in_usage + "%")
      .attr("aria-valuenow", percent_in_usage);
  };

  let updateProgressColor = (memoryData, con) => {
    percent_in_usage = Math.floor(memoryData.percent_in_usage * 100);
    $(".nb-memory-usage-progress").removeClassLike("mem-mon-progress-color");
    addClass = clazz => $(".nb-memory-usage-progress").addClass(clazz);
    switch (true) {
      case percent_in_usage >= con.danger_threshold:
        addClass("mem-mon-progress-color-danger");
        break;
      case percent_in_usage >= con.warn_threshold:
        addClass("mem-mon-progress-color-warn");
        break;
      default:
        addClass("mem-mon-progress-color-success");
    }
  };

  let interruptKernel = (memoryData, con) => {
    percent_in_usage = Math.floor(memoryData.percent_in_usage * 100);
    if (percent_in_usage >= con.kernel_restart_threshold) {
      let d = Date(Date.now());
      console.warn(
        `${d}: The RAM got to ${percent_in_usage}%. The Kernel Restart threshold is ${con.kernel_restart_threshold}%. The Kernel is restarting...`
      );
      Jupyter.notebook.kernel.restart();
    }
  };

  let initialize = () => {
    $(`#nb-memory-usage-${conf.progressSize}`).show();
    doubleClickHandlerProgress(conf);
    getAndHandleData();
    // Update every N seconds?
    setInterval(getAndHandleData, 1000 * conf.poll_interval);
    onDataHandler(conf);
  };

  let load_ipython_extension = () => {
    // Add Extension css
    $('<link rel="stylesheet" type="text/css">')
      .attr("href", require.toUrl("./static/main.css"))
      .appendTo("head");

    // Load Extension html
    return require(["text!nbextensions/memory_monitor/static/main.html"], function(text) {
      $("#maintoolbar-container").append(text);
      return Jupyter.notebook.config.loaded.then(initialize);
    }, function(err) {
      console.log("Error", err);
    });
  };

  return {
    load_ipython_extension: load_ipython_extension
  };
});
