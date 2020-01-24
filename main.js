define(["base/js/namespace", "base/js/events", "base/js/utils", "require", "./utils"], function(
  Jupyter,
  events,
  utils,
  require,
  memUtils
) {
  var params = {
    use_large_progress: false,
    warn_threshhold: 65,
    danger_threshhold: 70,
    console_log_data: false
  };

  // updates default params with any specified in the server's config
  conf = $.extend(true, params, Jupyter.notebook.config.data.memorymonitor);
  conf.progressSize = conf.use_large_progress ? "lg" : "sm";

  var echoResults = function() {
    if (document.hidden) {
      // Don't poll when nobody is looking
      return;
    }
    $.getJSON(utils.get_body_data("baseUrl") + "echo", function(data) {
      $(`#nb-memory-usage-${conf.progressSize}`).trigger("memory-data", data);
      conf.console_log_data && console.log(data);
    });
  };

  let updateProgress = memoryData => {
    percent_in_usage = Math.floor(memoryData.percent_in_usage * 100);
    $(".nb-memory-usage-progress")
      .css("width", percent_in_usage + "%")
      .attr("aria-valuenow", percent_in_usage);
    // .text(percent_in_usage + "% Used");
  };

  let updateProgressColor = (memoryData, con) => {
    percent_in_usage = Math.floor(memoryData.percent_in_usage * 100);
    $(".nb-memory-usage-progress").removeClassLike("mem-mon-progress-color");
    addClass = clazz => $(".nb-memory-usage-progress").addClass(clazz);
    switch (true) {
      case percent_in_usage >= con.danger_threshhold:
        addClass("mem-mon-progress-color-danger");
        break;
      case percent_in_usage >= con.warn_threshhold:
        addClass("mem-mon-progress-color-warn");
        break;
      default:
        addClass("mem-mon-progress-color-success");
    }
  };

  var initialize = function() {
    $(`#nb-memory-usage-${conf.progressSize}`).show();
    echoResults();
    // Update every N seconds?
    setInterval(echoResults, 1000 * 3);

    $(`#nb-memory-usage-${conf.progressSize}`).on("memory-data", function(data, memoryData) {
      updateProgress(memoryData);
      updateProgressColor(memoryData, conf);
    });

    document.addEventListener(
      "visibilitychange",
      function() {
        // Update instantly when user activates notebook tab
        // FIXME: Turn off update timer completely when tab not in focus
        if (!document.hidden) {
          echoResults();
        }
      },
      false
    );
  };

  var load_ipython_extension = function() {
    // Add Extension css
    $('<link rel="stylesheet" type="text/css">')
      .attr("href", require.toUrl("./static/main.css"))
      .appendTo("head");

    // Load Extension html
    return require(["text!nbextensions/memory_monitor/static/hello.html"], function(text) {
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
