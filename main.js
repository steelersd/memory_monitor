define(["base/js/namespace", "base/js/events", "base/js/utils", "require"], function(Jupyter, events, utils, require) {
  var params = {
    use_large_progress: false
  };

  // updates default params with any specified in the server's config
  conf = $.extend(true, params, Jupyter.notebook.config.data);
  conf.progressSize = conf.use_large_progress ? "lg" : "sm";

  var echoResults = function() {
    if (document.hidden) {
      // Don't poll when nobody is looking
      return;
    }
    $.getJSON(utils.get_body_data("baseUrl") + "echo", function(data) {
      $(`#nb-memory-usage-${conf.progressSize}`).trigger("memory-data", data);
      console.log(data);
    });
  };

  let updateProgress = memoryData => {
    percent_in_usage = Math.floor(memoryData.percent_in_usage * 100);
    $(".nb-memory-usage-progress")
      .css("width", percent_in_usage + "%")
      .attr("aria-valuenow", percent_in_usage);
    // .text(percent_in_usage + "% Used");
  };

  var initialize = function() {
    $(`#nb-memory-usage-${conf.progressSize}`).show();
    // $("#nb-memory-usage-sm").hide();
    echoResults();
    // Update every five seconds, eh?
    setInterval(echoResults, 1000 * 3);

    // $(document).on("memory-data", function(data, memoryData) {
    $(`#nb-memory-usage-${conf.progressSize}`).on("memory-data", function(data, memoryData) {
      updateProgress(memoryData);
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
    // add css
    $('<link rel="stylesheet" type="text/css">')
      .attr("href", require.toUrl("./static/main.css"))
      .appendTo("head");

    return require(["text!nbextensions/memory_monitor/static/hello.html"], function(text) {
      // use text
      console.log(text);
      $("#maintoolbar-container").append(text);

      // $("head").append('<style type="text/css"> .noheader { height: 100% !important }</style>');
      return Jupyter.notebook.config.loaded.then(initialize);
      // return true;
    }, function(err) {
      console.log("Error", err);
      // OPTIONAL BUT GOOD PRACTICE
      // handle error
    });
  };

  return {
    load_ipython_extension: load_ipython_extension
  };
});
