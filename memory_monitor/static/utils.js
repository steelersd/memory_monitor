// https://stackoverflow.com/a/32200028

(function($) {
  $(document).ready(function() {
    $.fn.removeClassLike = function(name) {
      return this.removeClass(function(index, css) {
        return (css.match(new RegExp("\\b(" + name + "\\S*)\\b", "g")) || []).join(" ");
      });
    };
  });
})(jQuery);
