define(["base/js/namespace", "base/js/events", "base/js/utils"], function(Jupyter, events, utils) {
  var params = {};
  // updates default params with any specified in the server's config
  var update_params = function() {
    var config = Jupyter.notebook.config;
    for (var key in params) {
      if (config.data.hasOwnProperty(key)) {
        params[key] = config.data[key];
      }
    }
  };

  var echoResults = function() {
    if (document.hidden) {
      // Don't poll when nobody is looking
      return;
    }
    $.getJSON(utils.get_body_data("baseUrl") + "echo", function(data) {
      // $("#nb-memory-usage").trigger("memory-data", data);
      $(document).trigger("memory-data", data);

      console.log(data);
    });
  };

  let updateProgress = memoryData => {
    percent_in_usage = Math.floor(memoryData.percent_in_usage * 100);
    $("#nb-memory-usage-progress")
      .css("width", percent_in_usage + "%")
      .attr("aria-valuenow", percent_in_usage)
      .text(percent_in_usage + "% Used");
  };

  var initialize = function() {
    echoResults();
    // Update every five seconds, eh?
    setInterval(echoResults, 1000 * 3);

    // $("#nb-memory-usage").on("memory-data", function(data) {
    $(document).on("memory-data", function(data, memoryData) {
      // $("#nb-memory-usage").on("memory-data", function(data, memoryData) {
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
    return require(["text!nbextensions/memory_monitor/static/hello.html"], function(text) {
      // use text
      console.log(text);
      $("#maintoolbar-container")
        // .append("<div>Hello Adam</div>")
        .append(text)
        .addClass("pull-right");

      $("head").append('<style type="text/css"> .noheader { height: 100% !important }</style>');
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
