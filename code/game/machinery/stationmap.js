/*!
 * jQuery scrollintoview() plugin and :scrollable selector filter
 *
 * Version 1.8 (14 Jul 2011)
 * Requires jQuery 1.4 or newer
 */

(function ($) {
    var converter = {
        vertical: { x: false, y: true },
        horizontal: { x: true, y: false },
        both: { x: true, y: true },
        x: { x: true, y: false },
        y: { x: false, y: true }
    };

    var settings = {
        duration: "fast",
        direction: "both"
    };

    var rootrx = /^(?:html)$/i;

    // gets border dimensions
    var borders = function (domElement, styles) {
        styles = styles || (document.defaultView && document.defaultView.getComputedStyle ? document.defaultView.getComputedStyle(domElement, null) : domElement.currentStyle);
        var px = document.defaultView && document.defaultView.getComputedStyle ? true : false;
        var b = {
            top: (parseFloat(px ? styles.borderTopWidth : $.css(domElement, "borderTopWidth")) || 0),
            left: (parseFloat(px ? styles.borderLeftWidth : $.css(domElement, "borderLeftWidth")) || 0),
            bottom: (parseFloat(px ? styles.borderBottomWidth : $.css(domElement, "borderBottomWidth")) || 0),
            right: (parseFloat(px ? styles.borderRightWidth : $.css(domElement, "borderRightWidth")) || 0)
        };
        return {
            top: b.top,
            left: b.left,
            bottom: b.bottom,
            right: b.right,
            vertical: b.top + b.bottom,
            horizontal: b.left + b.right
        };
    };

    var dimensions = function ($element) {
        var win = $(window);
        var isRoot = rootrx.test($element[0].nodeName);
        return {
            border: isRoot ? { top: 0, left: 0, bottom: 0, right: 0} : borders($element[0]),
            scroll: {
                top: (isRoot ? win : $element).scrollTop(),
                left: (isRoot ? win : $element).scrollLeft()
            },
            scrollbar: {
                right: isRoot ? 0 : $element.innerWidth() - $element[0].clientWidth,
                bottom: isRoot ? 0 : $element.innerHeight() - $element[0].clientHeight
            },
            rect: (function () {
                var r = $element[0].getBoundingClientRect();
                return {
                    top: isRoot ? 0 : r.top,
                    left: isRoot ? 0 : r.left,
                    bottom: isRoot ? $element[0].clientHeight : r.bottom,
                    right: isRoot ? $element[0].clientWidth : r.right
                };
            })()
        };
    };

    $.fn.extend({
        scrollintoview: function (options) {
            /// <summary>Scrolls the first element in the set into view by scrolling its closest scrollable parent.</summary>
            /// <param name="options" type="Object">Additional options that can configure scrolling:
            ///        duration (default: "fast") - jQuery animation speed (can be a duration string or number of milliseconds)
            ///        direction (default: "both") - select possible scrollings ("vertical" or "y", "horizontal" or "x", "both")
            ///        complete (default: none) - a function to call when scrolling completes (called in context of the DOM element being scrolled)
            /// </param>
            /// <return type="jQuery">Returns the same jQuery set that this function was run on.</return>

            options = $.extend({}, settings, options);
            options.direction = converter[typeof (options.direction) === "string" && options.direction.toLowerCase()] || converter.both;

            var dirStr = "";
            if (options.direction.x === true) dirStr = "horizontal";
            if (options.direction.y === true) dirStr = dirStr ? "both" : "vertical";

            var el = this.eq(0);
            var scroller = el.closest(":scrollable(" + dirStr + ")");

            // check if there's anything to scroll in the first place
            if (scroller.length > 0)
            {
                scroller = scroller.eq(0);

                var dim = {
                    e: dimensions(el),
                    s: dimensions(scroller)
                };

                var rel = {
                    top: dim.e.rect.top - (dim.s.rect.top + dim.s.border.top),
                    bottom: dim.s.rect.bottom - dim.s.border.bottom - dim.s.scrollbar.bottom - dim.e.rect.bottom,
                    left: dim.e.rect.left - (dim.s.rect.left + dim.s.border.left),
                    right: dim.s.rect.right - dim.s.border.right - dim.s.scrollbar.right - dim.e.rect.right
                };

                var animOptions = {};

                // vertical scroll
                if (options.direction.y === true)
                {
                    if (rel.top < 0)
                    {
                        animOptions.scrollTop = dim.s.scroll.top + rel.top;
                    }
                    else if (rel.top > 0 && rel.bottom < 0)
                    {
                        animOptions.scrollTop = dim.s.scroll.top + Math.min(rel.top, -rel.bottom);
                    }
                }

                // horizontal scroll
                if (options.direction.x === true)
                {
                    if (rel.left < 0)
                    {
                        animOptions.scrollLeft = dim.s.scroll.left + rel.left;
                    }
                    else if (rel.left > 0 && rel.right < 0)
                    {
                        animOptions.scrollLeft = dim.s.scroll.left + Math.min(rel.left, -rel.right);
                    }
                }

                // scroll if needed
                if (!$.isEmptyObject(animOptions))
                {
                    if (rootrx.test(scroller[0].nodeName))
                    {
                        scroller = $("html,body");
                    }
                    scroller
                        .animate(animOptions, options.duration)
                        .eq(0) // we want function to be called just once (ref. "html,body")
                        .queue(function (next) {
                            $.isFunction(options.complete) && options.complete.call(scroller[0]);
                            next();
                        });
                }
                else
                {
                    // when there's nothing to scroll, just call the "complete" function
                    $.isFunction(options.complete) && options.complete.call(scroller[0]);
                }
            }

            // return set back
            return this;
        }
    });

    var scrollValue = {
        auto: true,
        scroll: true,
        visible: false,
        hidden: false
    };

    $.extend($.expr[":"], {
        scrollable: function (element, index, meta, stack) {
            var direction = converter[typeof (meta[3]) === "string" && meta[3].toLowerCase()] || converter.both;
            var styles = (document.defaultView && document.defaultView.getComputedStyle ? document.defaultView.getComputedStyle(element, null) : element.currentStyle);
            var overflow = {
                x: scrollValue[styles.overflowX.toLowerCase()] || false,
                y: scrollValue[styles.overflowY.toLowerCase()] || false,
                isRoot: rootrx.test(element.nodeName)
            };

            // check if completely unscrollable (exclude HTML element because it's special)
            if (!overflow.x && !overflow.y && !overflow.isRoot)
            {
                return false;
            }

            var size = {
                height: {
                    scroll: element.scrollHeight,
                    client: element.clientHeight
                },
                width: {
                    scroll: element.scrollWidth,
                    client: element.clientWidth
                },
                // check overflow.x/y because iPad (and possibly other tablets) don't dislay scrollbars
                scrollableX: function () {
                    return (overflow.x || overflow.isRoot) && this.width.scroll > this.width.client;
                },
                scrollableY: function () {
                    return (overflow.y || overflow.isRoot) && this.height.scroll > this.height.client;
                }
            };
            return direction.y && size.scrollableY() || direction.x && size.scrollableX();
        }
    });
})(jQuery);

/*!
 * Crew manifest script
 */

var minimap_height = 480;
var scale_x;
var scale_y;
var zoom_factor = null;
var minimap_mousedown = false;
var minimap_mousedown_scrollLeft;
var minimap_mousedown_scrollTop;
var minimap_mousedown_clientX;
var minimap_mousedown_clientY;
var minimap_mousedown_counter = 0;

function disableSelection(){ return false; };

$(window).on("onUpdateContent", function()
{
	$("#minimap").append("<img src=\"minimap_" + z + ".png\" id=\"map\" style=\"width: auto; height: " + minimap_height + "px;\" />");

	$("body")[0].onselectstart = disableSelection;

	$("#minimap").on("click", function(e)
	{
		if (!$(e.target).is(".zoom,.dot"))
		{
			var x		= ((((e.clientX + this.scrollLeft - 8) / scale_x) / tile_size) + 1).toFixed(0);
			var y		= ((maxy - (((e.clientY + this.scrollTop - 8) / scale_y) / tile_size)) + 1).toFixed(0);

			window.location.href = "byond://?src=" + hSrc + "&action=select_position&x=" + x + "&y=" + y;
		}
	}).on("mousedown", function(e)
	{
		minimap_mousedown_scrollLeft = this.scrollLeft;
		minimap_mousedown_scrollTop = this.scrollTop;
		minimap_mousedown_clientX = e.clientX;
		minimap_mousedown_clientY = e.clientY;

		var c = ++minimap_mousedown_counter;
		setTimeout(function()
		{
			if (c == minimap_mousedown_counter)
			{
				minimap_mousedown = true;
				$("#minimap").css("cursor", "move");
			}
		}, 100);
	});

	$(document).on("mousemove", function(e)
	{
		if (minimap_mousedown)
		{
			var offsetX = minimap_mousedown_clientX - e.clientX;
			var offsetY = minimap_mousedown_clientY - e.clientY;

			var minimap = document.getElementById("minimap");
			minimap.scrollLeft = minimap_mousedown_scrollLeft + offsetX;
			minimap.scrollTop = minimap_mousedown_scrollTop + offsetY;
		}
	}).on("mouseup", function()
	{
		++minimap_mousedown_counter;
		if (minimap_mousedown)
		{
			document.body.focus();
			minimap_mousedown = false;
			$("#minimap").css("cursor", "");
		}
	});

	$(window).on("resize", onResize);

	scaleMinimap(1.00);
});

function zoomIn()
{
	scaleMinimap(Math.min(6.00, zoom_factor + 1.00));
}

function zoomOut()
{
	scaleMinimap(Math.max(1.00, zoom_factor - 1.00));
}

function scaleMinimap(factor)
{
	var $minimap					= $("#minimap");

	if (factor != zoom_factor)
	{
		zoom_factor					= factor;

		var old_map_width			= $minimap.width();
		var old_map_height			= $minimap.height();
		var old_canvas_size			= $("#minimap > img").height(); // height is assumed to be the same
		var new_canvas_size			= minimap_height * factor;      // ditto

		var old_scrollLeft			= $minimap[0].scrollLeft;
		var old_scrollTop			= $minimap[0].scrollTop;

		var old_factor				= old_canvas_size / minimap_height;
		var diff_factor				= factor - old_factor;

		var old_centerX				= ((old_map_width  / 2) * diff_factor) + old_scrollLeft;
		var old_centerY				= ((old_map_height / 2) * diff_factor) + old_scrollTop;

		$("#minimap > img").css("height", new_canvas_size + "px");
		$minimap.css("max-width", new_canvas_size + "px");

		var new_map_width			= $minimap.width();
		var new_map_height			= $minimap.height();

		var new_centerX				= (new_map_width  / 2) + old_centerX;
		var new_centerY				= (new_map_height / 2) + old_centerY;

		var scrollLeft				= new_centerX - (new_map_width  / 2);
		var scrollTop				= new_centerY - (new_map_height / 2);

		scale_x						= new_canvas_size / (maxx * tile_size);
		scale_y						= new_canvas_size / (maxy * tile_size);

		onResize();

		$minimap[0].scrollLeft		= scrollLeft;
		$minimap[0].scrollTop		= scrollTop;

		$(".dot").each(function()
		{
			var $this				= $(this);
			var tx					= translateX(parseInt($this.attr("data-x")));
			var ty					= translateY(parseInt($this.attr("data-y")));

			// Workaround for IE bug where it doesn't modify the positions.
			setTimeout(function(){ $this.css({ "top": ty + "px", "left": tx + "px" });}, 0);
		});
	}
}

function onResize()
{
	if (zoom_factor == 1.00)
	{
		$(".zoom").css("left", "442px");
		$("#minimap").css("max-height", Math.min($(window).height() - 16, 480) + "px");
	}
	else
	{
		$(".zoom").css("left", ($("#minimap").width() - 34) + "px");
		$("#minimap").css("max-height", Math.min($(window).height() - 16, $("#minimap > img").height()) + "px");
	}

	$("body").css("padding-left", Math.min($(window).width() - 400, $("#minimap").width() - 10) + "px");
}

var updateMap = true;

var orig_scrollTop = 0;

function clearAll()
{
	orig_scrollTop = $(window).scrollTop();
	$("#minimap .dot").remove();
}

function onAfterUpdate()
{
	$(window).scrollTop(orig_scrollTop);
}

function add(pos_x, pos_y)
{
	var x					= parseInt(pos_x);
	var y					= maxy - parseInt(pos_y);

	var tx					= translateX(x);
	var ty					= translateY(y);

	var dotElem				= $("<div class=\"dot\" style=\"top: " + ty + "px; left: " + tx + "px; z-index: 0;\" data-x=\"" + x + "\" data-y=\"" + y + "\"></div>");

	$("#minimap").append(dotElem);
}

function translateX(n)	{ return (translate(n - 1.5, scale_x) ).toFixed(0); }
function translateY(n)	{ return (translate(n + 0.75, scale_y) ).toFixed(0); }

function translate(n, scale)
{
	return (n * tile_size) * scale;
}
