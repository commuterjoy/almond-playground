
/**
 * EventEmitter v3.1.5
 * https://github.com/Wolfy87/EventEmitter
 *
 * Oliver Caldwell (http://oli.me.uk)
 * Creative Commons Attribution 3.0 Unported License (http://creativecommons.org/licenses/by/3.0/)
 */

;(function(exports) {
	// JSHint config
	/*jshint smarttabs:true,devel:true*/
	/*global define:true*/
	
	// Place the script into strict mode
	
	
	/**
	 * EventEmitter class
	 * Creates an object with event registering and firing methods
	 */
	function EventEmitter() {
		// Initialise required storage variables
		this._events = {};
		this._maxListeners = 10;
	}
	
	/**
	 * Event class
	 * Contains Event methods and property storage
	 *
	 * @param {String} type Event type name
	 * @param {Function} listener Function to be called when the event is fired
	 * @param {Object} scope Object that this should be set to when the listener is called
	 * @param {Boolean} once If true then the listener will be removed after the first call
	 * @param {Object} instance The parent EventEmitter instance
	 */
	function Event(type, listener, scope, once, instance) {
		// Store arguments
		this.type = type;
		this.listener = listener;
		this.scope = scope;
		this.once = once;
		this.instance = instance;
	}
	
	/**
	 * Executes the listener
	 *
	 * @param {Array} args List of arguments to pass to the listener
	 * @return {Boolean} If false then it was a once event
	 */
	Event.prototype.fire = function(args) {
		this.listener.apply(this.scope || this.instance, args);
		
		// Remove the listener if this is a once only listener
		if(this.once) {
			this.instance.removeListener(this.type, this.listener, this.scope);
			return false;
		}
	};
	
	/**
	 * Passes every listener for a specified event to a function one at a time
	 *
	 * @param {String} type Event type name
	 * @param {Function} callback Function to pass each listener to
	 * @return {Object} The current EventEmitter instance to allow chaining
	 */
	EventEmitter.prototype.eachListener = function(type, callback) {
		// Initialise variables
		var i = null,
			possibleListeners = null,
			result = null;
		
		// Only loop if the type exists
		if(this._events.hasOwnProperty(type)) {
			possibleListeners = this._events[type];
			
			for(i = 0; i < possibleListeners.length; i += 1) {
				result = callback.call(this, possibleListeners[i], i);
				
				if(result === false) {
					i -= 1;
				}
				else if(result === true) {
					break;
				}
			}
		}
		
		// Return the instance to allow chaining
		return this;
	};
	
	/**
	 * Adds an event listener for the specified event
	 *
	 * @param {String} type Event type name
	 * @param {Function} listener Function to be called when the event is fired
	 * @param {Object} scope Object that this should be set to when the listener is called
	 * @param {Boolean} once If true then the listener will be removed after the first call
	 * @return {Object} The current EventEmitter instance to allow chaining
	 */
	EventEmitter.prototype.addListener = function(type, listener, scope, once) {
		// Create the listener array if it does not exist yet
		if(!this._events.hasOwnProperty(type)) {
			this._events[type] = [];
		}
		
		// Push the new event to the array
		this._events[type].push(new Event(type, listener, scope, once, this));
		
		// Emit the new listener event
		this.emit('newListener', type, listener, scope, once);
		
		// Check if we have exceeded the maxListener count
		// Ignore this check if the count is 0
		// Also don't check if we have already fired a warning
		if(this._maxListeners && !this._events[type].warned && this._events[type].length > this._maxListeners) {
			// The max listener count has been exceeded!
			// Warn via the console if it exists
			if(typeof console !== 'undefined') {
				console.warn('Possible EventEmitter memory leak detected. ' + this._events[type].length + ' listeners added. Use emitter.setMaxListeners() to increase limit.');
			}
			
			// Set the flag so it doesn't fire again
			this._events[type].warned = true;
		}
		
		// Return the instance to allow chaining
		return this;
	};
	
	/**
	 * Alias of the addListener method
	 *
	 * @param {String} type Event type name
	 * @param {Function} listener Function to be called when the event is fired
	 * @param {Object} scope Object that this should be set to when the listener is called
	 * @param {Boolean} once If true then the listener will be removed after the first call
	 */
	EventEmitter.prototype.on = EventEmitter.prototype.addListener;
	
	/**
	 * Alias of the addListener method but will remove the event after the first use
	 *
	 * @param {String} type Event type name
	 * @param {Function} listener Function to be called when the event is fired
	 * @param {Object} scope Object that this should be set to when the listener is called
	 * @return {Object} The current EventEmitter instance to allow chaining
	 */
	EventEmitter.prototype.once = function(type, listener, scope) {
		return this.addListener(type, listener, scope, true);
	};
	
	/**
	 * Removes the a listener for the specified event
	 *
	 * @param {String} type Event type name the listener must have for the event to be removed
	 * @param {Function} listener Listener the event must have to be removed
	 * @param {Object} scope The scope the event must have to be removed
	 * @return {Object} The current EventEmitter instance to allow chaining
	 */
	EventEmitter.prototype.removeListener = function(type, listener, scope) {
		this.eachListener(type, function(currentListener, index) {
			// If this is the listener remove it from the array
			// We also compare the scope if it was passed
			if(currentListener.listener === listener && (!scope || currentListener.scope === scope)) {
				this._events[type].splice(index, 1);
			}
		});
		
		// Remove the property if there are no more listeners
		if(this._events[type] && this._events[type].length === 0) {
			delete this._events[type];
		}
		
		// Return the instance to allow chaining
		return this;
	};
	
	/**
	 * Alias of the removeListener method
	 *
	 * @param {String} type Event type name the listener must have for the event to be removed
	 * @param {Function} listener Listener the event must have to be removed
	 * @param {Object} scope The scope the event must have to be removed
	 * @return {Object} The current EventEmitter instance to allow chaining
	 */
	EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
	
	/**
	 * Removes all listeners for a specified event
	 * If no event type is passed it will remove every listener
	 *
	 * @param {String} type Event type name to remove all listeners from
	 * @return {Object} The current EventEmitter instance to allow chaining
	 */
	EventEmitter.prototype.removeAllListeners = function(type) {
		// Check for a type, if there is none remove all listeners
		// If there is a type however, just remove the listeners for that type
		if(type && this._events.hasOwnProperty(type)) {
			delete this._events[type];
		}
		else if(!type) {
			this._events = {};
		}
		
		// Return the instance to allow chaining
		return this;
	};
	
	/**
	 * Retrieves the array of listeners for a specified event
	 *
	 * @param {String} type Event type name to return all listeners from
	 * @return {Array} Will return either an array of listeners or an empty array if there are none
	 */
	EventEmitter.prototype.listeners = function(type) {
		// Return the array of listeners or an empty array if it does not exist
		if(this._events.hasOwnProperty(type)) {
			// It does exist, loop over building the array
			var listeners = [];
			
			this.eachListener(type, function(evt) {
				listeners.push(evt.listener);
			});
			
			return listeners;
		}
		
		return [];
	};
	
	/**
	 * Emits an event executing all appropriate listeners
	 * All values passed after the type will be passed as arguments to the listeners
	 *
	 * @param {String} type Event type name to run all listeners from
	 * @return {Object} The current EventEmitter instance to allow chaining
	 */
	EventEmitter.prototype.emit = function(type) {
		// Calculate the arguments
		var args = [],
			i = null;
		
		for(i = 1; i < arguments.length; i += 1) {
			args.push(arguments[i]);
		}
		
		this.eachListener(type, function(currentListener) {
			return currentListener.fire(args);
		});
		
		// Return the instance to allow chaining
		return this;
	};
	
	/**
	 * Sets the max listener count for the EventEmitter
	 * When the count of listeners for an event exceeds this limit a warning will be printed
	 * Set to 0 for no limit
	 *
	 * @param {Number} maxListeners The new max listener limit
	 * @return {Object} The current EventEmitter instance to allow chaining
	 */
	EventEmitter.prototype.setMaxListeners = function(maxListeners) {
		this._maxListeners = maxListeners;
		
		// Return the instance to allow chaining
		return this;
	};
	
	/**
	 * Builds a clone of the prototype object for you to extend with
	 *
	 * @return {Object} A clone of the EventEmitter prototype object
	 */
	EventEmitter.extend = function() {
		// First thing we need to do is create our new prototype
		// Then we loop over the current one copying each method out
		// When done, simply return the clone
		var clone = {},
			current = this.prototype,
			key = null;
		
		for(key in current) {
			// Make sure this is actually a property of the object before copying it
			// We don't want any default object methods leaking though
			if(current.hasOwnProperty(key)) {
				clone[key] = current[key];
			}
		}
		
		// All done, return the clone
		return clone;
	};
	
	// Export the class
	// If AMD is available then use it
	if(typeof define === 'function' && define.amd) {
		define('EventEmitter',[],function() {
			return EventEmitter;
		});
	}
	
	// No matter what it will be added to the global object
	exports.EventEmitter = EventEmitter;
}(this));

/*!
  * Bonzo: DOM Utility (c) Dustin Diaz 2012
  * https://github.com/ded/bonzo
  * License MIT
  */
(function (name, definition, context) {
  if (typeof module != 'undefined' && module.exports) module.exports = definition()
  else if (typeof context['define'] == 'function' && context['define']['amd']) define('bonzo',[],definition)
  else context[name] = definition()
})('bonzo', function() {
  var win = window
    , doc = win.document
    , html = doc.documentElement
    , parentNode = 'parentNode'
    , query = null // used for setting a selector engine host
    , specialAttributes = /^(checked|value|selected|disabled)$/i
    , specialTags = /^(select|fieldset|table|tbody|tfoot|td|tr|colgroup)$/i // tags that we have trouble inserting *into*
    , table = ['<table>', '</table>', 1]
    , td = ['<table><tbody><tr>', '</tr></tbody></table>', 3]
    , option = ['<select>', '</select>', 1]
    , noscope = ['_', '', 0, 1]
    , tagMap = { // tags that we have trouble *inserting*
          thead: table, tbody: table, tfoot: table, colgroup: table, caption: table
        , tr: ['<table><tbody>', '</tbody></table>', 2]
        , th: td , td: td
        , col: ['<table><colgroup>', '</colgroup></table>', 2]
        , fieldset: ['<form>', '</form>', 1]
        , legend: ['<form><fieldset>', '</fieldset></form>', 2]
        , option: option, optgroup: option
        , script: noscope, style: noscope, link: noscope, param: noscope, base: noscope
      }
    , stateAttributes = /^(checked|selected|disabled)$/
    , ie = /msie/i.test(navigator.userAgent)
    , hasClass, addClass, removeClass
    , uidMap = {}
    , uuids = 0
    , digit = /^-?[\d\.]+$/
    , dattr = /^data-(.+)$/
    , px = 'px'
    , setAttribute = 'setAttribute'
    , getAttribute = 'getAttribute'
    , byTag = 'getElementsByTagName'
    , features = function() {
        var e = doc.createElement('p')
        e.innerHTML = '<a href="#x">x</a><table style="float:left;"></table>'
        return {
          hrefExtended: e[byTag]('a')[0][getAttribute]('href') != '#x' // IE < 8
        , autoTbody: e[byTag]('tbody').length !== 0 // IE < 8
        , computedStyle: doc.defaultView && doc.defaultView.getComputedStyle
        , cssFloat: e[byTag]('table')[0].style.styleFloat ? 'styleFloat' : 'cssFloat'
        , transform: function () {
            var props = ['webkitTransform', 'MozTransform', 'OTransform', 'msTransform', 'Transform'], i
            for (i = 0; i < props.length; i++) {
              if (props[i] in e.style) return props[i]
            }
          }()
        , classList: 'classList' in e
        , opasity: function () {
            return typeof doc.createElement('a').style.opacity !== 'undefined'
          }()
        }
      }()
    , trimReplace = /(^\s*|\s*$)/g
    , whitespaceRegex = /\s+/
    , toString = String.prototype.toString
    , unitless = { lineHeight: 1, zoom: 1, zIndex: 1, opacity: 1, boxFlex: 1, WebkitBoxFlex: 1, MozBoxFlex: 1 }
    , trim = String.prototype.trim ?
        function (s) {
          return s.trim()
        } :
        function (s) {
          return s.replace(trimReplace, '')
        }


  /**
   * @param {string} c a class name to test
   * @return {boolean}
   */
  function classReg(c) {
    return new RegExp("(^|\\s+)" + c + "(\\s+|$)")
  }


  /**
   * @param {Bonzo|Array} ar
   * @param {function(Object, number, (Bonzo|Array))} fn
   * @param {Object=} opt_scope
   * @param {boolean=} opt_rev
   * @return {Bonzo|Array}
   */
  function each(ar, fn, opt_scope, opt_rev) {
    var ind, i = 0, l = ar.length
    for (; i < l; i++) {
      ind = opt_rev ? ar.length - i - 1 : i
      fn.call(opt_scope || ar[ind], ar[ind], ind, ar)
    }
    return ar
  }


  /**
   * @param {Bonzo|Array} ar
   * @param {function(Object, number, (Bonzo|Array))} fn
   * @param {Object=} opt_scope
   * @return {Bonzo|Array}
   */
  function deepEach(ar, fn, opt_scope) {
    for (var i = 0, l = ar.length; i < l; i++) {
      if (isNode(ar[i])) {
        deepEach(ar[i].childNodes, fn, opt_scope)
        fn.call(opt_scope || ar[i], ar[i], i, ar)
      }
    }
    return ar
  }


  /**
   * @param {string} s
   * @return {string}
   */
  function camelize(s) {
    return s.replace(/-(.)/g, function (m, m1) {
      return m1.toUpperCase()
    })
  }


  /**
   * @param {string} s
   * @return {string}
   */
  function decamelize(s) {
    return s ? s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase() : s
  }


  /**
   * @param {Element} el
   * @return {*}
   */
  function data(el) {
    el[getAttribute]('data-node-uid') || el[setAttribute]('data-node-uid', ++uuids)
    var uid = el[getAttribute]('data-node-uid')
    return uidMap[uid] || (uidMap[uid] = {})
  }


  /**
   * removes the data associated with an element
   * @param {Element} el
   */
  function clearData(el) {
    var uid = el[getAttribute]('data-node-uid')
    if (uid) delete uidMap[uid]
  }


  function dataValue(d) {
    var f
    try {
      return (d === null || d === undefined) ? undefined :
        d === 'true' ? true :
          d === 'false' ? false :
            d === 'null' ? null :
              (f = parseFloat(d)) == d ? f : d;
    } catch(e) {}
    return undefined
  }

  function isNode(node) {
    return node && node.nodeName && (node.nodeType == 1 || node.nodeType == 11)
  }


  /**
   * @param {Bonzo|Array} ar
   * @param {function(Object, number, (Bonzo|Array))} fn
   * @param {Object=} opt_scope
   * @return {boolean} whether `some`thing was found
   */
  function some(ar, fn, opt_scope) {
    for (var i = 0, j = ar.length; i < j; ++i) if (fn.call(opt_scope || null, ar[i], i, ar)) return true
    return false
  }


  /**
   * this could be a giant enum of CSS properties
   * but in favor of file size sans-closure deadcode optimizations
   * we're just asking for any ol string
   * then it gets transformed into the appropriate style property for JS access
   * @param {string} p
   * @return {string}
   */
  function styleProperty(p) {
      (p == 'transform' && (p = features.transform)) ||
        (/^transform-?[Oo]rigin$/.test(p) && (p = features.transform + "Origin")) ||
        (p == 'float' && (p = features.cssFloat))
      return p ? camelize(p) : null
  }

  var getStyle = features.computedStyle ?
    function (el, property) {
      var value = null
        , computed = doc.defaultView.getComputedStyle(el, '')
      computed && (value = computed[property])
      return el.style[property] || value
    } :

    (ie && html.currentStyle) ?

    /**
     * @param {Element} el
     * @param {string} property
     * @return {string|number}
     */
    function (el, property) {
      if (property == 'opacity' && !features.opasity) {
        var val = 100
        try {
          val = el['filters']['DXImageTransform.Microsoft.Alpha'].opacity
        } catch (e1) {
          try {
            val = el['filters']('alpha').opacity
          } catch (e2) {}
        }
        return val / 100
      }
      var value = el.currentStyle ? el.currentStyle[property] : null
      return el.style[property] || value
    } :

    function (el, property) {
      return el.style[property]
    }

  // this insert method is intense
  function insert(target, host, fn, rev) {
    var i = 0, self = host || this, r = []
      // target nodes could be a css selector if it's a string and a selector engine is present
      // otherwise, just use target
      , nodes = query && typeof target == 'string' && target.charAt(0) != '<' ? query(target) : target
    // normalize each node in case it's still a string and we need to create nodes on the fly
    each(normalize(nodes), function (t, j) {
      each(self, function (el) {
        fn(t, r[i++] = j > 0 ? cloneNode(self, el) : el)
      }, null, rev)
    }, this, rev)
    self.length = i
    each(r, function (e) {
      self[--i] = e
    }, null, !rev)
    return self
  }


  /**
   * sets an element to an explicit x/y position on the page
   * @param {Element} el
   * @param {?number} x
   * @param {?number} y
   */
  function xy(el, x, y) {
    var $el = bonzo(el)
      , style = $el.css('position')
      , offset = $el.offset()
      , rel = 'relative'
      , isRel = style == rel
      , delta = [parseInt($el.css('left'), 10), parseInt($el.css('top'), 10)]

    if (style == 'static') {
      $el.css('position', rel)
      style = rel
    }

    isNaN(delta[0]) && (delta[0] = isRel ? 0 : el.offsetLeft)
    isNaN(delta[1]) && (delta[1] = isRel ? 0 : el.offsetTop)

    x != null && (el.style.left = x - offset.left + delta[0] + px)
    y != null && (el.style.top = y - offset.top + delta[1] + px)

  }

  // classList support for class management
  // altho to be fair, the api sucks because it won't accept multiple classes at once
  if (features.classList) {
    hasClass = function (el, c) {
      return el.classList.contains(c)
    }
    addClass = function (el, c) {
      el.classList.add(c)
    }
    removeClass = function (el, c) {
      el.classList.remove(c)
    }
  }
  else {
    hasClass = function (el, c) {
      return classReg(c).test(el.className)
    }
    addClass = function (el, c) {
      el.className = trim(el.className + ' ' + c)
    }
    removeClass = function (el, c) {
      el.className = trim(el.className.replace(classReg(c), ' '))
    }
  }


  /**
   * this allows method calling for setting values
   *
   * @example
   * bonzo(elements).css('color', function (el) {
   *   return el.getAttribute('data-original-color')
   * })
   *
   * @param {Element} el
   * @param {function (Element)|string}
   * @return {string}
   */
  function setter(el, v) {
    return typeof v == 'function' ? v(el) : v
  }

  /**
   * @constructor
   * @param {Array.<Element>|Element|Node|string} elements
   */
  function Bonzo(elements) {
    this.length = 0
    if (elements) {
      elements = typeof elements !== 'string' &&
        !elements.nodeType &&
        typeof elements.length !== 'undefined' ?
          elements :
          [elements]
      this.length = elements.length
      for (var i = 0; i < elements.length; i++) this[i] = elements[i]
    }
  }

  Bonzo.prototype = {

      /**
       * @param {number} index
       * @return {Element|Node}
       */
      get: function (index) {
        return this[index] || null
      }

      // itetators
      /**
       * @param {function(Element|Node)} fn
       * @param {Object=} opt_scope
       * @return {Bonzo}
       */
    , each: function (fn, opt_scope) {
        return each(this, fn, opt_scope)
      }

      /**
       * @param {Function} fn
       * @param {Object=} opt_scope
       * @return {Bonzo}
       */
    , deepEach: function (fn, opt_scope) {
        return deepEach(this, fn, opt_scope)
      }


      /**
       * @param {Function} fn
       * @param {Function=} opt_reject
       * @return {Array}
       */
    , map: function (fn, opt_reject) {
        var m = [], n, i
        for (i = 0; i < this.length; i++) {
          n = fn.call(this, this[i], i)
          opt_reject ? (opt_reject(n) && m.push(n)) : m.push(n)
        }
        return m
      }

    // text and html inserters!

    /**
     * @param {string} h the HTML to insert
     * @param {boolean=} opt_text whether to set or get text content
     * @return {Bonzo|string}
     */
    , html: function (h, opt_text) {
        var method = opt_text
              ? html.textContent === undefined ? 'innerText' : 'textContent'
              : 'innerHTML'
          , that = this
          , append = function (el, i) {
              each(normalize(h, that, i), function (node) {
                el.appendChild(node)
              })
            }
          , updateElement = function (el, i) {
              try {
                if (opt_text || (typeof h == 'string' && !specialTags.test(el.tagName))) {
                  return el[method] = h
                }
              } catch (e) {}
              append(el, i)
            }
        return typeof h != 'undefined'
          ? this.empty().each(updateElement)
          : this[0] ? this[0][method] : ''
      }

      /**
       * @param {string=} opt_text the text to set, otherwise this is a getter
       * @return {Bonzo|string}
       */
    , text: function (opt_text) {
        return this.html(opt_text, true)
      }

      // more related insertion methods

      /**
       * @param {Bonzo|string|Element|Array} node
       * @return {Bonzo}
       */
    , append: function (node) {
        var that = this
        return this.each(function (el, i) {
          each(normalize(node, that, i), function (i) {
            el.appendChild(i)
          })
        })
      }


      /**
       * @param {Bonzo|string|Element|Array} node
       * @return {Bonzo}
       */
    , prepend: function (node) {
        var that = this
        return this.each(function (el, i) {
          var first = el.firstChild
          each(normalize(node, that, i), function (i) {
            el.insertBefore(i, first)
          })
        })
      }


      /**
       * @param {Bonzo|string|Element|Array} target the location for which you'll insert your new content
       * @param {Object=} opt_host an optional host scope (primarily used when integrated with Ender)
       * @return {Bonzo}
       */
    , appendTo: function (target, opt_host) {
        return insert.call(this, target, opt_host, function (t, el) {
          t.appendChild(el)
        })
      }


      /**
       * @param {Bonzo|string|Element|Array} target the location for which you'll insert your new content
       * @param {Object=} opt_host an optional host scope (primarily used when integrated with Ender)
       * @return {Bonzo}
       */
    , prependTo: function (target, opt_host) {
        return insert.call(this, target, opt_host, function (t, el) {
          t.insertBefore(el, t.firstChild)
        }, 1)
      }


      /**
       * @param {Bonzo|string|Element|Array} node
       * @return {Bonzo}
       */
    , before: function (node) {
        var that = this
        return this.each(function (el, i) {
          each(normalize(node, that, i), function (i) {
            el[parentNode].insertBefore(i, el)
          })
        })
      }


      /**
       * @param {Bonzo|string|Element|Array} node
       * @return {Bonzo}
       */
    , after: function (node) {
        var that = this
        return this.each(function (el, i) {
          each(normalize(node, that, i), function (i) {
            el[parentNode].insertBefore(i, el.nextSibling)
          }, null, 1)
        })
      }


      /**
       * @param {Bonzo|string|Element|Array} target the location for which you'll insert your new content
       * @param {Object=} opt_host an optional host scope (primarily used when integrated with Ender)
       * @return {Bonzo}
       */
    , insertBefore: function (target, opt_host) {
        return insert.call(this, target, opt_host, function (t, el) {
          t[parentNode].insertBefore(el, t)
        })
      }


      /**
       * @param {Bonzo|string|Element|Array} target the location for which you'll insert your new content
       * @param {Object=} opt_host an optional host scope (primarily used when integrated with Ender)
       * @return {Bonzo}
       */
    , insertAfter: function (target, opt_host) {
        return insert.call(this, target, opt_host, function (t, el) {
          var sibling = t.nextSibling
          sibling ?
            t[parentNode].insertBefore(el, sibling) :
            t[parentNode].appendChild(el)
        }, 1)
      }


      /**
       * @param {Bonzo|string|Element|Array} node
       * @param {Object=} opt_host an optional host scope (primarily used when integrated with Ender)
       * @return {Bonzo}
       */
    , replaceWith: function (node, opt_host) {
        var ret = bonzo(normalize(node)).insertAfter(this, opt_host)
        this.remove()
        Bonzo.call(opt_host || this, ret)
        return opt_host || this
      }

      // class management

      /**
       * @param {string} c
       * @return {Bonzo}
       */
    , addClass: function (c) {
        c = toString.call(c).split(whitespaceRegex)
        return this.each(function (el) {
          // we `each` here so you can do $el.addClass('foo bar')
          each(c, function (c) {
            if (c && !hasClass(el, setter(el, c)))
              addClass(el, setter(el, c))
          })
        })
      }


      /**
       * @param {string} c
       * @return {Bonzo}
       */
    , removeClass: function (c) {
        c = toString.call(c).split(whitespaceRegex)
        return this.each(function (el) {
          each(c, function (c) {
            if (c && hasClass(el, setter(el, c)))
              removeClass(el, setter(el, c))
          })
        })
      }


      /**
       * @param {string} c
       * @return {boolean}
       */
    , hasClass: function (c) {
        c = toString.call(c).split(whitespaceRegex)
        return some(this, function (el) {
          return some(c, function (c) {
            return c && hasClass(el, c)
          })
        })
      }


      /**
       * @param {string} c classname to toggle
       * @param {boolean=} opt_condition whether to add or remove the class straight away
       * @return {Bonzo}
       */
    , toggleClass: function (c, opt_condition) {
        c = toString.call(c).split(whitespaceRegex)
        return this.each(function (el) {
          each(c, function (c) {
            if (c) {
              typeof opt_condition !== 'undefined' ?
                opt_condition ? addClass(el, c) : removeClass(el, c) :
                hasClass(el, c) ? removeClass(el, c) : addClass(el, c)
            }
          })
        })
      }

      // display togglers

      /**
       * @param {string=} opt_type useful to set back to anything other than an empty string
       * @return {Bonzo}
       */
    , show: function (opt_type) {
        opt_type = typeof opt_type == 'string' ? opt_type : ''
        return this.each(function (el) {
          el.style.display = opt_type
        })
      }


      /**
       * @return {Bonzo}
       */
    , hide: function () {
        return this.each(function (el) {
          el.style.display = 'none'
        })
      }


      /**
       * @param {Function=} opt_callback
       * @param {string=} opt_type
       * @return {Bonzo}
       */
    , toggle: function (opt_callback, opt_type) {
        opt_type = typeof opt_type == 'string' ? opt_type : '';
        typeof opt_callback != 'function' && (opt_callback = null)
        return this.each(function (el) {
          el.style.display = (el.offsetWidth || el.offsetHeight) ? 'none' : opt_type;
          opt_callback && opt_callback.call(el)
        })
      }


      // DOM Walkers & getters

      /**
       * @return {Element|Node}
       */
    , first: function () {
        return bonzo(this.length ? this[0] : [])
      }


      /**
       * @return {Element|Node}
       */
    , last: function () {
        return bonzo(this.length ? this[this.length - 1] : [])
      }


      /**
       * @return {Element|Node}
       */
    , next: function () {
        return this.related('nextSibling')
      }


      /**
       * @return {Element|Node}
       */
    , previous: function () {
        return this.related('previousSibling')
      }


      /**
       * @return {Element|Node}
       */
    , parent: function() {
        return this.related(parentNode)
      }


      /**
       * @private
       * @param {string} method the directional DOM method
       * @return {Element|Node}
       */
    , related: function (method) {
        return this.map(
          function (el) {
            el = el[method]
            while (el && el.nodeType !== 1) {
              el = el[method]
            }
            return el || 0
          },
          function (el) {
            return el
          }
        )
      }


      /**
       * @return {Bonzo}
       */
    , focus: function () {
        this.length && this[0].focus()
        return this
      }


      /**
       * @return {Bonzo}
       */
    , blur: function () {
        this.length && this[0].blur()
        return this
      }

      // style getter setter & related methods

      /**
       * @param {Object|string} o
       * @param {string=} opt_v
       * @return {Bonzo|string}
       */
    , css: function (o, opt_v) {
        var p, iter = o
        // is this a request for just getting a style?
        if (opt_v === undefined && typeof o == 'string') {
          // repurpose 'v'
          opt_v = this[0]
          if (!opt_v) return null
          if (opt_v === doc || opt_v === win) {
            p = (opt_v === doc) ? bonzo.doc() : bonzo.viewport()
            return o == 'width' ? p.width : o == 'height' ? p.height : ''
          }
          return (o = styleProperty(o)) ? getStyle(opt_v, o) : null
        }

        if (typeof o == 'string') {
          iter = {}
          iter[o] = opt_v
        }

        if (ie && iter.opacity) {
          // oh this 'ol gamut
          iter.filter = 'alpha(opacity=' + (iter.opacity * 100) + ')'
          // give it layout
          iter.zoom = o.zoom || 1;
          delete iter.opacity;
        }

        function fn(el, p, v) {
          for (var k in iter) {
            if (iter.hasOwnProperty(k)) {
              v = iter[k];
              // change "5" to "5px" - unless you're line-height, which is allowed
              (p = styleProperty(k)) && digit.test(v) && !(p in unitless) && (v += px)
              try { el.style[p] = setter(el, v) } catch(e) {}
            }
          }
        }
        return this.each(fn)
      }


      /**
       * @param {number=} opt_x
       * @param {number=} opt_y
       * @return {Bonzo|number}
       */
    , offset: function (opt_x, opt_y) {
        if (typeof opt_x == 'number' || typeof opt_y == 'number') {
          return this.each(function (el) {
            xy(el, opt_x, opt_y)
          })
        }
        if (!this[0]) return {
            top: 0
          , left: 0
          , height: 0
          , width: 0
        }
        var el = this[0]
          , width = el.offsetWidth
          , height = el.offsetHeight
          , top = el.offsetTop
          , left = el.offsetLeft
        while (el = el.offsetParent) {
          top = top + el.offsetTop
          left = left + el.offsetLeft

          if (el != doc.body) {
            top -= el.scrollTop
            left -= el.scrollLeft
          }
        }

        return {
            top: top
          , left: left
          , height: height
          , width: width
        }
      }


      /**
       * @return {number}
       */
    , dim: function () {
        if (!this.length) return { height: 0, width: 0 }
        var el = this[0]
          , orig = !el.offsetWidth && !el.offsetHeight ?
             // el isn't visible, can't be measured properly, so fix that
             function (t) {
               var s = {
                   position: el.style.position || ''
                 , visibility: el.style.visibility || ''
                 , display: el.style.display || ''
               }
               t.first().css({
                   position: 'absolute'
                 , visibility: 'hidden'
                 , display: 'block'
               })
               return s
            }(this) : null
          , width = el.offsetWidth
          , height = el.offsetHeight

        orig && this.first().css(orig)
        return {
            height: height
          , width: width
        }
      }

      // attributes are hard. go shopping

      /**
       * @param {string} k an attribute to get or set
       * @param {string=} opt_v the value to set
       * @return {Bonzo|string}
       */
    , attr: function (k, opt_v) {
        var el = this[0]
        if (typeof k != 'string' && !(k instanceof String)) {
          for (var n in k) {
            k.hasOwnProperty(n) && this.attr(n, k[n])
          }
          return this
        }
        return typeof opt_v == 'undefined' ?
          !el ? null : specialAttributes.test(k) ?
            stateAttributes.test(k) && typeof el[k] == 'string' ?
              true : el[k] : (k == 'href' || k =='src') && features.hrefExtended ?
                el[getAttribute](k, 2) : el[getAttribute](k) :
          this.each(function (el) {
            specialAttributes.test(k) ? (el[k] = setter(el, opt_v)) : el[setAttribute](k, setter(el, opt_v))
          })
      }


      /**
       * @param {string} k
       * @return {Bonzo}
       */
    , removeAttr: function (k) {
        return this.each(function (el) {
          stateAttributes.test(k) ? (el[k] = false) : el.removeAttribute(k)
        })
      }


      /**
       * @param {string=} opt_s
       * @return {Bonzo|string}
       */
    , val: function (s) {
        return (typeof s == 'string') ?
          this.attr('value', s) :
          this.length ? this[0].value : null
      }

      // use with care and knowledge. this data() method uses data attributes on the DOM nodes
      // to do this differently costs a lot more code. c'est la vie
      /**
       * @param {string|Object=} opt_k the key for which to get or set data
       * @param {Object=} opt_v
       * @return {Bonzo|Object}
       */
    , data: function (opt_k, opt_v) {
        var el = this[0], o, m
        if (typeof opt_v === 'undefined') {
          if (!el) return null
          o = data(el)
          if (typeof opt_k === 'undefined') {
            each(el.attributes, function (a) {
              (m = ('' + a.name).match(dattr)) && (o[camelize(m[1])] = dataValue(a.value))
            })
            return o
          } else {
            if (typeof o[opt_k] === 'undefined')
              o[opt_k] = dataValue(this.attr('data-' + decamelize(opt_k)))
            return o[opt_k]
          }
        } else {
          return this.each(function (el) { data(el)[opt_k] = opt_v })
        }
      }

      // DOM detachment & related

      /**
       * @return {Bonzo}
       */
    , remove: function () {
        this.deepEach(clearData)

        return this.each(function (el) {
          el[parentNode] && el[parentNode].removeChild(el)
        })
      }


      /**
       * @return {Bonzo}
       */
    , empty: function () {
        return this.each(function (el) {
          deepEach(el.childNodes, clearData)

          while (el.firstChild) {
            el.removeChild(el.firstChild)
          }
        })
      }


      /**
       * @return {Bonzo}
       */
    , detach: function () {
        return this.each(function (el) {
          el[parentNode].removeChild(el)
        })
      }

      // who uses a mouse anyway? oh right.

      /**
       * @param {number} y
       */
    , scrollTop: function (y) {
        return scroll.call(this, null, y, 'y')
      }


      /**
       * @param {number} x
       */
    , scrollLeft: function (x) {
        return scroll.call(this, x, null, 'x')
      }

  }

  function normalize(node, host, clone) {
    var i, l, ret
    if (typeof node == 'string') return bonzo.create(node)
    if (isNode(node)) node = [ node ]
    if (clone) {
      ret = [] // don't change original array
      for (i = 0, l = node.length; i < l; i++) ret[i] = cloneNode(host, node[i])
      return ret
    }
    return node
  }

  function cloneNode(host, el) {
    var c = el.cloneNode(true)
      , cloneElems
      , elElems

    // check for existence of an event cloner
    // preferably https://github.com/fat/bean
    // otherwise Bonzo won't do this for you
    if (host.$ && typeof host.cloneEvents == 'function') {
      host.$(c).cloneEvents(el)

      // clone events from every child node
      cloneElems = host.$(c).find('*')
      elElems = host.$(el).find('*')

      for (var i = 0; i < elElems.length; i++)
        host.$(cloneElems[i]).cloneEvents(elElems[i])
    }
    return c
  }

  function scroll(x, y, type) {
    var el = this[0]
    if (!el) return this
    if (x == null && y == null) {
      return (isBody(el) ? getWindowScroll() : { x: el.scrollLeft, y: el.scrollTop })[type]
    }
    if (isBody(el)) {
      win.scrollTo(x, y)
    } else {
      x != null && (el.scrollLeft = x)
      y != null && (el.scrollTop = y)
    }
    return this
  }

  function isBody(element) {
    return element === win || (/^(?:body|html)$/i).test(element.tagName)
  }

  function getWindowScroll() {
    return { x: win.pageXOffset || html.scrollLeft, y: win.pageYOffset || html.scrollTop }
  }

  /**
   * @param {Array.<Element>|Element|Node|string} els
   * @return {Bonzo}
   */
  function bonzo(els) {
    return new Bonzo(els)
  }

  bonzo.setQueryEngine = function (q) {
    query = q;
    delete bonzo.setQueryEngine
  }

  bonzo.aug = function (o, target) {
    // for those standalone bonzo users. this love is for you.
    for (var k in o) {
      o.hasOwnProperty(k) && ((target || Bonzo.prototype)[k] = o[k])
    }
  }

  bonzo.create = function (node) {
    // hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh
    return typeof node == 'string' && node !== '' ?
      function () {
        var tag = /^\s*<([^\s>]+)/.exec(node)
          , el = doc.createElement('div')
          , els = []
          , p = tag ? tagMap[tag[1].toLowerCase()] : null
          , dep = p ? p[2] + 1 : 1
          , ns = p && p[3]
          , pn = parentNode
          , tb = features.autoTbody && p && p[0] == '<table>' && !(/<tbody/i).test(node)

        el.innerHTML = p ? (p[0] + node + p[1]) : node
        while (dep--) el = el.firstChild
        // for IE NoScope, we may insert cruft at the begining just to get it to work
        if (ns && el && el.nodeType !== 1) el = el.nextSibling
        do {
          // tbody special case for IE<8, creates tbody on any empty table
          // we don't want it if we're just after a <thead>, <caption>, etc.
          if ((!tag || el.nodeType == 1) && (!tb || el.tagName.toLowerCase() != 'tbody')) {
            els.push(el)
          }
        } while (el = el.nextSibling)
        // IE < 9 gives us a parentNode which messes up insert() check for cloning
        // `dep` > 1 can also cause problems with the insert() check (must do this last)
        each(els, function(el) { el[pn] && el[pn].removeChild(el) })
        return els
      }() : isNode(node) ? [node.cloneNode(true)] : []
  }

  bonzo.doc = function () {
    var vp = bonzo.viewport()
    return {
        width: Math.max(doc.body.scrollWidth, html.scrollWidth, vp.width)
      , height: Math.max(doc.body.scrollHeight, html.scrollHeight, vp.height)
    }
  }

  bonzo.firstChild = function (el) {
    for (var c = el.childNodes, i = 0, j = (c && c.length) || 0, e; i < j; i++) {
      if (c[i].nodeType === 1) e = c[j = i]
    }
    return e
  }

  bonzo.viewport = function () {
    return {
        width: ie ? html.clientWidth : self.innerWidth
      , height: ie ? html.clientHeight : self.innerHeight
    }
  }

  bonzo.isAncestor = 'compareDocumentPosition' in html ?
    function (container, element) {
      return (container.compareDocumentPosition(element) & 16) == 16
    } : 'contains' in html ?
    function (container, element) {
      return container !== element && container.contains(element);
    } :
    function (container, element) {
      while (element = element[parentNode]) {
        if (element === container) {
          return true
        }
      }
      return false
    }

  return bonzo
}, this); // the only line we care about using a semi-colon. placed here for concatenation tools
;
/*!
  * @preserve Qwery - A Blazing Fast query selector engine
  * https://github.com/ded/qwery
  * copyright Dustin Diaz & Jacob Thornton 2012
  * MIT License
  */

(function (name, definition, context) {
  if (typeof module != 'undefined' && module.exports) module.exports = definition()
  else if (typeof context['define'] == 'function' && context['define']['amd']) define('qwery',[],definition)
  else context[name] = definition()
})('qwery', function () {
  var doc = document
    , html = doc.documentElement
    , byClass = 'getElementsByClassName'
    , byTag = 'getElementsByTagName'
    , qSA = 'querySelectorAll'
    , useNativeQSA = 'useNativeQSA'
    , tagName = 'tagName'
    , nodeType = 'nodeType'
    , select // main select() method, assign later

    , id = /#([\w\-]+)/
    , clas = /\.[\w\-]+/g
    , idOnly = /^#([\w\-]+)$/
    , classOnly = /^\.([\w\-]+)$/
    , tagOnly = /^([\w\-]+)$/
    , tagAndOrClass = /^([\w]+)?\.([\w\-]+)$/
    , splittable = /(^|,)\s*[>~+]/
    , normalizr = /^\s+|\s*([,\s\+\~>]|$)\s*/g
    , splitters = /[\s\>\+\~]/
    , splittersMore = /(?![\s\w\-\/\?\&\=\:\.\(\)\!,@#%<>\{\}\$\*\^'"]*\]|[\s\w\+\-]*\))/
    , specialChars = /([.*+?\^=!:${}()|\[\]\/\\])/g
    , simple = /^(\*|[a-z0-9]+)?(?:([\.\#]+[\w\-\.#]+)?)/
    , attr = /\[([\w\-]+)(?:([\|\^\$\*\~]?\=)['"]?([ \w\-\/\?\&\=\:\.\(\)\!,@#%<>\{\}\$\*\^]+)["']?)?\]/
    , pseudo = /:([\w\-]+)(\(['"]?([^()]+)['"]?\))?/
    , easy = new RegExp(idOnly.source + '|' + tagOnly.source + '|' + classOnly.source)
    , dividers = new RegExp('(' + splitters.source + ')' + splittersMore.source, 'g')
    , tokenizr = new RegExp(splitters.source + splittersMore.source)
    , chunker = new RegExp(simple.source + '(' + attr.source + ')?' + '(' + pseudo.source + ')?')
    , walker = {
        ' ': function (node) {
          return node && node !== html && node.parentNode
        }
      , '>': function (node, contestant) {
          return node && node.parentNode == contestant.parentNode && node.parentNode
        }
      , '~': function (node) {
          return node && node.previousSibling
        }
      , '+': function (node, contestant, p1, p2) {
          if (!node) return false
          return (p1 = previous(node)) && (p2 = previous(contestant)) && p1 == p2 && p1
        }
      }

  function cache() {
    this.c = {}
  }
  cache.prototype = {
    g: function (k) {
      return this.c[k] || undefined
    }
  , s: function (k, v, r) {
      v = r ? new RegExp(v) : v
      return (this.c[k] = v)
    }
  }

  var classCache = new cache()
    , cleanCache = new cache()
    , attrCache = new cache()
    , tokenCache = new cache()

  function classRegex(c) {
    return classCache.g(c) || classCache.s(c, '(^|\\s+)' + c + '(\\s+|$)', 1)
  }

  // not quite as fast as inline loops in older browsers so don't use liberally
  function each(a, fn) {
    var i = 0, l = a.length
    for (; i < l; i++) fn(a[i])
  }

  function flatten(ar) {
    for (var r = [], i = 0, l = ar.length; i < l; ++i) arrayLike(ar[i]) ? (r = r.concat(ar[i])) : (r[r.length] = ar[i])
    return r
  }

  function arrayify(ar) {
    var i = 0, l = ar.length, r = []
    for (; i < l; i++) r[i] = ar[i]
    return r
  }

  function previous(n) {
    while (n = n.previousSibling) if (n[nodeType] == 1) break;
    return n
  }

  function q(query) {
    return query.match(chunker)
  }

  // called using `this` as element and arguments from regex group results.
  // given => div.hello[title="world"]:foo('bar')
  // div.hello[title="world"]:foo('bar'), div, .hello, [title="world"], title, =, world, :foo('bar'), foo, ('bar'), bar]
  function interpret(whole, tag, idsAndClasses, wholeAttribute, attribute, qualifier, value, wholePseudo, pseudo, wholePseudoVal, pseudoVal) {
    var i, m, k, o, classes
    if (this[nodeType] !== 1) return false
    if (tag && tag !== '*' && this[tagName] && this[tagName].toLowerCase() !== tag) return false
    if (idsAndClasses && (m = idsAndClasses.match(id)) && m[1] !== this.id) return false
    if (idsAndClasses && (classes = idsAndClasses.match(clas))) {
      for (i = classes.length; i--;) if (!classRegex(classes[i].slice(1)).test(this.className)) return false
    }
    if (pseudo && qwery.pseudos[pseudo] && !qwery.pseudos[pseudo](this, pseudoVal)) return false
    if (wholeAttribute && !value) { // select is just for existance of attrib
      o = this.attributes
      for (k in o) {
        if (Object.prototype.hasOwnProperty.call(o, k) && (o[k].name || k) == attribute) {
          return this
        }
      }
    }
    if (wholeAttribute && !checkAttr(qualifier, getAttr(this, attribute) || '', value)) {
      // select is for attrib equality
      return false
    }
    return this
  }

  function clean(s) {
    return cleanCache.g(s) || cleanCache.s(s, s.replace(specialChars, '\\$1'))
  }

  function checkAttr(qualify, actual, val) {
    switch (qualify) {
    case '=':
      return actual == val
    case '^=':
      return actual.match(attrCache.g('^=' + val) || attrCache.s('^=' + val, '^' + clean(val), 1))
    case '$=':
      return actual.match(attrCache.g('$=' + val) || attrCache.s('$=' + val, clean(val) + '$', 1))
    case '*=':
      return actual.match(attrCache.g(val) || attrCache.s(val, clean(val), 1))
    case '~=':
      return actual.match(attrCache.g('~=' + val) || attrCache.s('~=' + val, '(?:^|\\s+)' + clean(val) + '(?:\\s+|$)', 1))
    case '|=':
      return actual.match(attrCache.g('|=' + val) || attrCache.s('|=' + val, '^' + clean(val) + '(-|$)', 1))
    }
    return 0
  }

  // given a selector, first check for simple cases then collect all base candidate matches and filter
  function _qwery(selector, _root) {
    var r = [], ret = [], i, l, m, token, tag, els, intr, item, root = _root
      , tokens = tokenCache.g(selector) || tokenCache.s(selector, selector.split(tokenizr))
      , dividedTokens = selector.match(dividers)

    if (!tokens.length) return r

    token = (tokens = tokens.slice(0)).pop() // copy cached tokens, take the last one
    if (tokens.length && (m = tokens[tokens.length - 1].match(idOnly))) root = byId(_root, m[1])
    if (!root) return r

    intr = q(token)
    // collect base candidates to filter
    els = root !== _root && root[nodeType] !== 9 && dividedTokens && /^[+~]$/.test(dividedTokens[dividedTokens.length - 1]) ?
      function (r) {
        while (root = root.nextSibling) {
          root[nodeType] == 1 && (intr[1] ? intr[1] == root[tagName].toLowerCase() : 1) && (r[r.length] = root)
        }
        return r
      }([]) :
      root[byTag](intr[1] || '*')
    // filter elements according to the right-most part of the selector
    for (i = 0, l = els.length; i < l; i++) {
      if (item = interpret.apply(els[i], intr)) r[r.length] = item
    }
    if (!tokens.length) return r

    // filter further according to the rest of the selector (the left side)
    each(r, function(e) { if (ancestorMatch(e, tokens, dividedTokens)) ret[ret.length] = e })
    return ret
  }

  // compare element to a selector
  function is(el, selector, root) {
    if (isNode(selector)) return el == selector
    if (arrayLike(selector)) return !!~flatten(selector).indexOf(el) // if selector is an array, is el a member?

    var selectors = selector.split(','), tokens, dividedTokens
    while (selector = selectors.pop()) {
      tokens = tokenCache.g(selector) || tokenCache.s(selector, selector.split(tokenizr))
      dividedTokens = selector.match(dividers)
      tokens = tokens.slice(0) // copy array
      if (interpret.apply(el, q(tokens.pop())) && (!tokens.length || ancestorMatch(el, tokens, dividedTokens, root))) {
        return true
      }
    }
    return false
  }

  // given elements matching the right-most part of a selector, filter out any that don't match the rest
  function ancestorMatch(el, tokens, dividedTokens, root) {
    var cand
    // recursively work backwards through the tokens and up the dom, covering all options
    function crawl(e, i, p) {
      while (p = walker[dividedTokens[i]](p, e)) {
        if (isNode(p) && (interpret.apply(p, q(tokens[i])))) {
          if (i) {
            if (cand = crawl(p, i - 1, p)) return cand
          } else return p
        }
      }
    }
    return (cand = crawl(el, tokens.length - 1, el)) && (!root || isAncestor(cand, root))
  }

  function isNode(el, t) {
    return el && typeof el === 'object' && (t = el[nodeType]) && (t == 1 || t == 9)
  }

  function uniq(ar) {
    var a = [], i, j
    o: for (i = 0; i < ar.length; ++i) {
      for (j = 0; j < a.length; ++j) if (a[j] == ar[i]) continue o
      a[a.length] = ar[i]
    }
    return a
  }

  function arrayLike(o) {
    return (typeof o === 'object' && isFinite(o.length))
  }

  function normalizeRoot(root) {
    if (!root) return doc
    if (typeof root == 'string') return qwery(root)[0]
    if (!root[nodeType] && arrayLike(root)) return root[0]
    return root
  }

  function byId(root, id, el) {
    // if doc, query on it, else query the parent doc or if a detached fragment rewrite the query and run on the fragment
    return root[nodeType] === 9 ? root.getElementById(id) :
      root.ownerDocument &&
        (((el = root.ownerDocument.getElementById(id)) && isAncestor(el, root) && el) ||
          (!isAncestor(root, root.ownerDocument) && select('[id="' + id + '"]', root)[0]))
  }

  function qwery(selector, _root) {
    var m, el, root = normalizeRoot(_root)

    // easy, fast cases that we can dispatch with simple DOM calls
    if (!root || !selector) return []
    if (selector === window || isNode(selector)) {
      return !_root || (selector !== window && isNode(root) && isAncestor(selector, root)) ? [selector] : []
    }
    if (selector && arrayLike(selector)) return flatten(selector)
    if (m = selector.match(easy)) {
      if (m[1]) return (el = byId(root, m[1])) ? [el] : []
      if (m[2]) return arrayify(root[byTag](m[2]))
      if (hasByClass && m[3]) return arrayify(root[byClass](m[3]))
    }

    return select(selector, root)
  }

  // where the root is not document and a relationship selector is first we have to
  // do some awkward adjustments to get it to work, even with qSA
  function collectSelector(root, collector) {
    return function(s) {
      var oid, nid
      if (splittable.test(s)) {
        if (root[nodeType] !== 9) {
         // make sure the el has an id, rewrite the query, set root to doc and run it
         if (!(nid = oid = root.getAttribute('id'))) root.setAttribute('id', nid = '__qwerymeupscotty')
         s = '[id="' + nid + '"]' + s // avoid byId and allow us to match context element
         collector(root.parentNode || root, s, true)
         oid || root.removeAttribute('id')
        }
        return;
      }
      s.length && collector(root, s, false)
    }
  }

  var isAncestor = 'compareDocumentPosition' in html ?
    function (element, container) {
      return (container.compareDocumentPosition(element) & 16) == 16
    } : 'contains' in html ?
    function (element, container) {
      container = container[nodeType] === 9 || container == window ? html : container
      return container !== element && container.contains(element)
    } :
    function (element, container) {
      while (element = element.parentNode) if (element === container) return 1
      return 0
    }
  , getAttr = function() {
      // detect buggy IE src/href getAttribute() call
      var e = doc.createElement('p')
      return ((e.innerHTML = '<a href="#x">x</a>') && e.firstChild.getAttribute('href') != '#x') ?
        function(e, a) {
          return a === 'class' ? e.className : (a === 'href' || a === 'src') ?
            e.getAttribute(a, 2) : e.getAttribute(a)
        } :
        function(e, a) { return e.getAttribute(a) }
   }()
  , hasByClass = !!doc[byClass]
    // has native qSA support
  , hasQSA = doc.querySelector && doc[qSA]
    // use native qSA
  , selectQSA = function (selector, root) {
      var result = [], ss, e
      try {
        if (root[nodeType] === 9 || !splittable.test(selector)) {
          // most work is done right here, defer to qSA
          return arrayify(root[qSA](selector))
        }
        // special case where we need the services of `collectSelector()`
        each(ss = selector.split(','), collectSelector(root, function(ctx, s) {
          e = ctx[qSA](s)
          if (e.length == 1) result[result.length] = e.item(0)
          else if (e.length) result = result.concat(arrayify(e))
        }))
        return ss.length > 1 && result.length > 1 ? uniq(result) : result
      } catch(ex) { }
      return selectNonNative(selector, root)
    }
    // no native selector support
  , selectNonNative = function (selector, root) {
      var result = [], items, m, i, l, r, ss
      selector = selector.replace(normalizr, '$1')
      if (m = selector.match(tagAndOrClass)) {
        r = classRegex(m[2])
        items = root[byTag](m[1] || '*')
        for (i = 0, l = items.length; i < l; i++) {
          if (r.test(items[i].className)) result[result.length] = items[i]
        }
        return result
      }
      // more complex selector, get `_qwery()` to do the work for us
      each(ss = selector.split(','), collectSelector(root, function(ctx, s, rewrite) {
        r = _qwery(s, ctx)
        for (i = 0, l = r.length; i < l; i++) {
          if (ctx[nodeType] === 9 || rewrite || isAncestor(r[i], root)) result[result.length] = r[i]
        }
      }))
      return ss.length > 1 && result.length > 1 ? uniq(result) : result
    }
  , configure = function (options) {
      // configNativeQSA: use fully-internal selector or native qSA where present
      if (typeof options[useNativeQSA] !== 'undefined')
        select = !options[useNativeQSA] ? selectNonNative : hasQSA ? selectQSA : selectNonNative
    }

  configure({ useNativeQSA: true })

  qwery.configure = configure
  qwery.uniq = uniq
  qwery.is = is
  qwery.pseudos = {}

  return qwery
}, this);

define('common',["EventEmitter", "bonzo", "qwery"], function (placeholder, bonzo, qwery) {
    return {
        mediator: new EventEmitter(),
        $g: function (selector, context) {
            if (context) {
                return bonzo(qwery(selector, context));
            }
            return bonzo(qwery(selector));
        }
    };
});

/*!
  * Reqwest! A general purpose XHR connection manager
  * (c) Dustin Diaz 2011
  * https://github.com/ded/reqwest
  * license MIT
  */
!function (name, definition) {
  if (typeof module != 'undefined') module.exports = definition()
  else if (typeof define == 'function' && define.amd) define('reqwest',[],definition)
  else this[name] = definition()
}('reqwest', function () {

  var win = window
    , doc = document
    , twoHundo = /^20\d$/
    , byTag = 'getElementsByTagName'
    , readyState = 'readyState'
    , contentType = 'Content-Type'
    , requestedWith = 'X-Requested-With'
    , head = doc[byTag]('head')[0]
    , uniqid = 0
    , lastValue // data stored by the most recent JSONP callback
    , xmlHttpRequest = 'XMLHttpRequest'
    , isArray = typeof Array.isArray == 'function' ? Array.isArray : function (a) {
        return a instanceof Array
      }
    , defaultHeaders = {
          contentType: 'application/x-www-form-urlencoded'
        , accept: {
              '*':  'text/javascript, text/html, application/xml, text/xml, */*'
            , xml:  'application/xml, text/xml'
            , html: 'text/html'
            , text: 'text/plain'
            , json: 'application/json, text/javascript'
            , js:   'application/javascript, text/javascript'
          }
        , requestedWith: xmlHttpRequest
      }
    , xhr = win[xmlHttpRequest] ?
        function () {
          return new XMLHttpRequest()
        } :
        function () {
          return new ActiveXObject('Microsoft.XMLHTTP')
        }

  function handleReadyState(o, success, error) {
    return function () {
      if (o && o[readyState] == 4) {
        if (twoHundo.test(o.status)) {
          success(o)
        } else {
          error(o)
        }
      }
    }
  }

  function setHeaders(http, o) {
    var headers = o.headers || {}, h
    headers.Accept = headers.Accept || defaultHeaders.accept[o.type] || defaultHeaders.accept['*']
    // breaks cross-origin requests with legacy browsers
    if (!o.crossOrigin && !headers[requestedWith]) headers[requestedWith] = defaultHeaders.requestedWith
    if (!headers[contentType]) headers[contentType] = o.contentType || defaultHeaders.contentType
    for (h in headers) {
      headers.hasOwnProperty(h) && http.setRequestHeader(h, headers[h])
    }
  }

  function generalCallback(data) {
    lastValue = data
  }

  function urlappend(url, s) {
    return url + (/\?/.test(url) ? '&' : '?') + s
  }

  function handleJsonp(o, fn, err, url) {
    var reqId = uniqid++
      , cbkey = o.jsonpCallback || 'callback' // the 'callback' key
      , cbval = o.jsonpCallbackName || ('reqwest_' + reqId) // the 'callback' value
      , cbreg = new RegExp('((^|\\?|&)' + cbkey + ')=([^&]+)')
      , match = url.match(cbreg)
      , script = doc.createElement('script')
      , loaded = 0

    if (match) {
      if (match[3] === '?') {
        url = url.replace(cbreg, '$1=' + cbval) // wildcard callback func name
      } else {
        cbval = match[3] // provided callback func name
      }
    } else {
      url = urlappend(url, cbkey + '=' + cbval) // no callback details, add 'em
    }

    win[cbval] = generalCallback

    script.type = 'text/javascript'
    script.src = url
    script.async = true
    if (typeof script.onreadystatechange !== 'undefined') {
        // need this for IE due to out-of-order onreadystatechange(), binding script
        // execution to an event listener gives us control over when the script
        // is executed. See http://jaubourg.net/2010/07/loading-script-as-onclick-handler-of.html
        script.event = 'onclick'
        script.htmlFor = script.id = '_reqwest_' + reqId
    }

    script.onload = script.onreadystatechange = function () {
      if ((script[readyState] && script[readyState] !== 'complete' && script[readyState] !== 'loaded') || loaded) {
        return false
      }
      script.onload = script.onreadystatechange = null
      script.onclick && script.onclick()
      // Call the user callback with the last value stored and clean up values and scripts.
      o.success && o.success(lastValue)
      lastValue = undefined
      head.removeChild(script)
      loaded = 1
    }

    // Add the script to the DOM head
    head.appendChild(script)
  }

  function getRequest(o, fn, err) {
    var method = (o.method || 'GET').toUpperCase()
      , url = typeof o === 'string' ? o : o.url
      // convert non-string objects to query-string form unless o.processData is false
      , data = (o.processData !== false && o.data && typeof o.data !== 'string')
        ? reqwest.toQueryString(o.data)
        : (o.data || null)
      , http

    // if we're working on a GET request and we have data then we should append
    // query string to end of URL and not post data
    if ((o.type == 'jsonp' || method == 'GET') && data) {
      url = urlappend(url, data)
      data = null
    }

    if (o.type == 'jsonp') return handleJsonp(o, fn, err, url)

    http = xhr()
    http.open(method, url, true)
    setHeaders(http, o)
    http.onreadystatechange = handleReadyState(http, fn, err)
    o.before && o.before(http)
    http.send(data)
    return http
  }

  function Reqwest(o, fn) {
    this.o = o
    this.fn = fn
    init.apply(this, arguments)
  }

  function setType(url) {
    var m = url.match(/\.(json|jsonp|html|xml)(\?|$)/)
    return m ? m[1] : 'js'
  }

  function init(o, fn) {
    this.url = typeof o == 'string' ? o : o.url
    this.timeout = null
    var type = o.type || setType(this.url)
      , self = this
    fn = fn || function () {}

    if (o.timeout) {
      this.timeout = setTimeout(function () {
        self.abort()
      }, o.timeout)
    }

    function complete(resp) {
      o.timeout && clearTimeout(self.timeout)
      self.timeout = null
      o.complete && o.complete(resp)
    }

    function success(resp) {
      var r = resp.responseText
      if (r) {
        switch (type) {
        case 'json':
          try {
            resp = win.JSON ? win.JSON.parse(r) : eval('(' + r + ')')
          } catch (err) {
            return error(resp, 'Could not parse JSON in response', err)
          }
          break;
        case 'js':
          resp = eval(r)
          break;
        case 'html':
          resp = r
          break;
        }
      }

      fn(resp)
      o.success && o.success(resp)

      complete(resp)
    }

    function error(resp, msg, t) {
      o.error && o.error(resp, msg, t)
      complete(resp)
    }

    this.request = getRequest(o, success, error)
  }

  Reqwest.prototype = {
    abort: function () {
      this.request.abort()
    }

  , retry: function () {
      init.call(this, this.o, this.fn)
    }
  }

  function reqwest(o, fn) {
    return new Reqwest(o, fn)
  }

  // normalize newline variants according to spec -> CRLF
  function normalize(s) {
    return s ? s.replace(/\r?\n/g, '\r\n') : ''
  }

  function serial(el, cb) {
    var n = el.name
      , t = el.tagName.toLowerCase()
      , optCb = function(o) {
          // IE gives value="" even where there is no value attribute
          // 'specified' ref: http://www.w3.org/TR/DOM-Level-3-Core/core.html#ID-862529273
          if (o && !o.disabled)
            cb(n, normalize(o.attributes.value && o.attributes.value.specified ? o.value : o.text))
        }

    // don't serialize elements that are disabled or without a name
    if (el.disabled || !n) return;

    switch (t) {
    case 'input':
      if (!/reset|button|image|file/i.test(el.type)) {
        var ch = /checkbox/i.test(el.type)
          , ra = /radio/i.test(el.type)
          , val = el.value;
        // WebKit gives us "" instead of "on" if a checkbox has no value, so correct it here
        (!(ch || ra) || el.checked) && cb(n, normalize(ch && val === '' ? 'on' : val))
      }
      break;
    case 'textarea':
      cb(n, normalize(el.value))
      break;
    case 'select':
      if (el.type.toLowerCase() === 'select-one') {
        optCb(el.selectedIndex >= 0 ? el.options[el.selectedIndex] : null)
      } else {
        for (var i = 0; el.length && i < el.length; i++) {
          el.options[i].selected && optCb(el.options[i])
        }
      }
      break;
    }
  }

  // collect up all form elements found from the passed argument elements all
  // the way down to child elements; pass a '<form>' or form fields.
  // called with 'this'=callback to use for serial() on each element
  function eachFormElement() {
    var cb = this
      , e, i, j
      , serializeSubtags = function(e, tags) {
        for (var i = 0; i < tags.length; i++) {
          var fa = e[byTag](tags[i])
          for (j = 0; j < fa.length; j++) serial(fa[j], cb)
        }
      }

    for (i = 0; i < arguments.length; i++) {
      e = arguments[i]
      if (/input|select|textarea/i.test(e.tagName)) serial(e, cb)
      serializeSubtags(e, [ 'input', 'select', 'textarea' ])
    }
  }

  // standard query string style serialization
  function serializeQueryString() {
    return reqwest.toQueryString(reqwest.serializeArray.apply(null, arguments))
  }

  // { 'name': 'value', ... } style serialization
  function serializeHash() {
    var hash = {}
    eachFormElement.apply(function (name, value) {
      if (name in hash) {
        hash[name] && !isArray(hash[name]) && (hash[name] = [hash[name]])
        hash[name].push(value)
      } else hash[name] = value
    }, arguments)
    return hash
  }

  // [ { name: 'name', value: 'value' }, ... ] style serialization
  reqwest.serializeArray = function () {
    var arr = []
    eachFormElement.apply(function(name, value) {
      arr.push({name: name, value: value})
    }, arguments)
    return arr
  }

  reqwest.serialize = function () {
    if (arguments.length === 0) return ''
    var opt, fn
      , args = Array.prototype.slice.call(arguments, 0)

    opt = args.pop()
    opt && opt.nodeType && args.push(opt) && (opt = null)
    opt && (opt = opt.type)

    if (opt == 'map') fn = serializeHash
    else if (opt == 'array') fn = reqwest.serializeArray
    else fn = serializeQueryString

    return fn.apply(null, args)
  }

  reqwest.toQueryString = function (o) {
    var qs = '', i
      , enc = encodeURIComponent
      , push = function (k, v) {
          qs += enc(k) + '=' + enc(v) + '&'
        }

    if (isArray(o)) {
      for (i = 0; o && i < o.length; i++) push(o[i].name, o[i].value)
    } else {
      for (var k in o) {
        if (!Object.hasOwnProperty.call(o, k)) continue;
        var v = o[k]
        if (isArray(v)) {
          for (i = 0; i < v.length; i++) push(k, v[i])
        } else push(k, o[k])
      }
    }

    // spaces should be + according to spec
    return qs.replace(/&$/, '').replace(/%20/g,'+')
  }

  // jQuery and Zepto compatibility, differences can be remapped here so you can call
  // .ajax.compat(options, callback)
  reqwest.compat = function (o, fn) {
    if (o) {
      o.type && (o.method = o.type) && delete o.type
      o.dataType && (o.type = o.dataType)
      o.jsonpCallback && (o.jsonpCallbackName = o.jsonpCallback) && delete o.jsonpCallback
      o.jsonp && (o.jsonpCallback = o.jsonp)
    }
    return new Reqwest(o, fn)
  }

  return reqwest
})
;
define('modules/related',['common', 'reqwest'], function (common, reqwest) {

    function Related(attachTo) {
        
        // View
        this.view = {
            attachTo: attachTo,
            render: function (html) {
                attachTo.innerHTML = html;
                common.mediator.emit('modules:related:render');
            }
        };

        // Bindings
        common.mediator.on('modules:related:loaded', this.view.render);
        
        // Model
        this.load = function (url) {
            return reqwest({
                url: url,
                type: 'jsonp',
                jsonpCallback: 'callback',
                jsonpCallbackName: 'showRelated',
                success: function (json) {
                    common.mediator.emit('modules:related:loaded', [json.html]);
                }
            });
        };

    }
    
    return Related;

});

/*
    Module: detect/detect.js
    Description: Used to detect various characteristics of the current browsing environment.
                 layout mode, connection speed, battery level, etc...
*/
/*jshint strict: false */

define('modules/detect',[],function () {

    var BASE_WIDTH     = 400,
        MEDIAN_WIDTH   = 650,
        EXTENDED_WIDTH = 900;
    
    function getLayoutMode() {
        var width = window.innerWidth,
            mode = "base";

        if (width > BASE_WIDTH) {
            mode = "median";
        }
        if (width > MEDIAN_WIDTH) {
            mode = "extended";
        }

        return mode;
    }

    function getPixelRatio() {
        return window.devicePixelRatio;
    }

    function getPageSpeed() {

        //https://dvcs.w3.org/hg/webperf/raw-file/tip/specs/NavigationTiming/Overview.html#sec-window.performance-attribute

        var start_time,
            end_time,
            total_time;

        var perf = window.performance || window.msPerformance || window.webkitPerformance || window.mozPerformance;
        if (perf && perf.timing) {
            start_time =  perf.timing.requestStart || perf.timing.fetchStart || perf.timing.navigationStart;
            end_time = perf.timing.responseStart;

            if (start_time && end_time) {
                total_time = end_time - start_time;
            }
        }

        return total_time;
    }

    function getConnectionSpeed() {

        var load_time = getPageSpeed();

        // Assume high speed for non supporting browsers.
        var speed = "high";

        if (load_time) {
            if (load_time > 1000) { // One second
                speed = 'medium';
                if (load_time > 4000) { // Four seconds
                    speed = 'low';
                }
            }
        }
        
        return speed;

    }

    function getFontFormatSupport(ua) {
        var format = 'woff';
            ua = ua.toLowerCase();
            
        if (ua.indexOf('android') > -1) {
            format = 'ttf';
        }
        if (ua.indexOf('iphone os') > -1 && ua.indexOf('iphone os 5') < 0) {
            format = 'ttf';
        }
        return format;
    }

    // http://modernizr.com/download/#-svg
    function hasSvgSupport() {
        var ns = {'svg': 'http://www.w3.org/2000/svg'};
        return !!document.createElementNS && !!document.createElementNS(ns.svg, 'svg').createSVGRect;
    }

    return {
        getLayoutMode: getLayoutMode,
        getPixelRatio: getPixelRatio,
        getConnectionSpeed: getConnectionSpeed,
        getFontFormatSupport: getFontFormatSupport,
        hasSvgSupport: hasSvgSupport
    };

});

define('modules/images',['common', 'modules/detect'], function (common, detect) {

    function Images() {
    
        var connectionSpeed = detect.getConnectionSpeed();

        // View

        this.view = {
            upgrade: function () {

                // upgrade svg images
                if (detect.hasSvgSupport()) {
                    common.$g('body').addClass('svg');
                }

                //upgrade other images
                var images = document.querySelectorAll('img[data-fullsrc]'); // Leave old browsers.
                for (var i = 0, j = images.length; i < j; ++i) {
                    var image = images[i];
                    var width = image.getAttribute('data-width');
                    var fullsrc = image.getAttribute('data-fullsrc');
                    if (width && width <= image.offsetWidth && fullsrc) {
                        image.src = fullsrc;
                        image.className += ' image-high';
                    }
                }
            }
        };

        // Bindings
        
        common.mediator.on('modules:images:upgrade', this.view.upgrade);
   
        // Model
        
        this.upgrade = function () {
            if (connectionSpeed !== 'low') {
                common.mediator.emit('modules:images:upgrade');
            }
        };
    }
    
    return Images;

});

define('modules/popular',['common', 'reqwest'], function (common, reqwest) {

    console.log(common, reqwest);

    function Popular(attachTo) {
        
        // View
        
        this.view = {
        
            attachTo: attachTo,

            render: function (html) {
                attachTo.innerHTML = html;
                common.mediator.emit('modules:popular:render');
            }
        
        };

        // Bindings
        
        common.mediator.on('modules:popular:loaded', this.view.render);
        
        // Model
        
        this.load = function (url) {
            return reqwest({
                    url: url,
                    type: 'jsonp',
                    jsonpCallback: 'callback',
                    jsonpCallbackName: 'showMostPopular',
                    success: function (json) {
                        common.mediator.emit('modules:popular:loaded', [json.html]);
                    }
                });
        };

    }
    
    return Popular;

});

/*!
  * bean.js - copyright Jacob Thornton 2011
  * https://github.com/fat/bean
  * MIT License
  * special thanks to:
  * dean edwards: http://dean.edwards.name/
  * dperini: https://github.com/dperini/nwevents
  * the entire mootools team: github.com/mootools/mootools-core
  */
!function (name, context, definition) {
  if (typeof module !== 'undefined') module.exports = definition(name, context);
  else if (typeof define === 'function' && typeof define.amd  === 'object') define('bean',[],definition);
  else context[name] = definition(name, context);
}('bean', this, function (name, context) {
  var win = window
    , old = context[name]
    , overOut = /over|out/
    , namespaceRegex = /[^\.]*(?=\..*)\.|.*/
    , nameRegex = /\..*/
    , addEvent = 'addEventListener'
    , attachEvent = 'attachEvent'
    , removeEvent = 'removeEventListener'
    , detachEvent = 'detachEvent'
    , ownerDocument = 'ownerDocument'
    , targetS = 'target'
    , qSA = 'querySelectorAll'
    , doc = document || {}
    , root = doc.documentElement || {}
    , W3C_MODEL = root[addEvent]
    , eventSupport = W3C_MODEL ? addEvent : attachEvent
    , slice = Array.prototype.slice
    , mouseTypeRegex = /click|mouse(?!(.*wheel|scroll))|menu|drag|drop/i
    , mouseWheelTypeRegex = /mouse.*(wheel|scroll)/i
    , textTypeRegex = /^text/i
    , touchTypeRegex = /^touch|^gesture/i
    , ONE = {} // singleton for quick matching making add() do one()

    , nativeEvents = (function (hash, events, i) {
        for (i = 0; i < events.length; i++)
          hash[events[i]] = 1
        return hash
      }({}, (
          'click dblclick mouseup mousedown contextmenu ' +                  // mouse buttons
          'mousewheel mousemultiwheel DOMMouseScroll ' +                     // mouse wheel
          'mouseover mouseout mousemove selectstart selectend ' +            // mouse movement
          'keydown keypress keyup ' +                                        // keyboard
          'orientationchange ' +                                             // mobile
          'focus blur change reset select submit ' +                         // form elements
          'load unload beforeunload resize move DOMContentLoaded '+          // window
          'readystatechange message ' +                                      // window
          'error abort scroll ' +                                            // misc
          (W3C_MODEL ? // element.fireEvent('onXYZ'... is not forgiving if we try to fire an event
                       // that doesn't actually exist, so make sure we only do these on newer browsers
            'show ' +                                                          // mouse buttons
            'input invalid ' +                                                 // form elements
            'touchstart touchmove touchend touchcancel ' +                     // touch
            'gesturestart gesturechange gestureend ' +                         // gesture
            'readystatechange pageshow pagehide popstate ' +                   // window
            'hashchange offline online ' +                                     // window
            'afterprint beforeprint ' +                                        // printing
            'dragstart dragenter dragover dragleave drag drop dragend ' +      // dnd
            'loadstart progress suspend emptied stalled loadmetadata ' +       // media
            'loadeddata canplay canplaythrough playing waiting seeking ' +     // media
            'seeked ended durationchange timeupdate play pause ratechange ' +  // media
            'volumechange cuechange ' +                                        // media
            'checking noupdate downloading cached updateready obsolete ' +     // appcache
            '' : '')
        ).split(' ')
      ))

    , customEvents = (function () {
        var cdp = 'compareDocumentPosition'
          , isAncestor = cdp in root
              ? function (element, container) {
                  return container[cdp] && (container[cdp](element) & 16) === 16
                }
              : 'contains' in root
                ? function (element, container) {
                    container = container.nodeType === 9 || container === window ? root : container
                    return container !== element && container.contains(element)
                  }
                : function (element, container) {
                    while (element = element.parentNode) if (element === container) return 1
                    return 0
                  }

        function check(event) {
          var related = event.relatedTarget
          return !related
            ? related === null
            : (related !== this && related.prefix !== 'xul' && !/document/.test(this.toString()) && !isAncestor(related, this))
        }

        return {
            mouseenter: { base: 'mouseover', condition: check }
          , mouseleave: { base: 'mouseout', condition: check }
          , mousewheel: { base: /Firefox/.test(navigator.userAgent) ? 'DOMMouseScroll' : 'mousewheel' }
        }
      }())

    , fixEvent = (function () {
        var commonProps = 'altKey attrChange attrName bubbles cancelable ctrlKey currentTarget detail eventPhase getModifierState isTrusted metaKey relatedNode relatedTarget shiftKey srcElement target timeStamp type view which'.split(' ')
          , mouseProps = commonProps.concat('button buttons clientX clientY dataTransfer fromElement offsetX offsetY pageX pageY screenX screenY toElement'.split(' '))
          , mouseWheelProps = mouseProps.concat('wheelDelta wheelDeltaX wheelDeltaY wheelDeltaZ axis'.split(' ')) // 'axis' is FF specific
          , keyProps = commonProps.concat('char charCode key keyCode keyIdentifier keyLocation'.split(' '))
          , textProps = commonProps.concat(['data'])
          , touchProps = commonProps.concat('touches targetTouches changedTouches scale rotation'.split(' '))
          , messageProps = commonProps.concat(['data', 'origin', 'source'])
          , preventDefault = 'preventDefault'
          , createPreventDefault = function (event) {
              return function () {
                if (event[preventDefault])
                  event[preventDefault]()
                else
                  event.returnValue = false
              }
            }
          , stopPropagation = 'stopPropagation'
          , createStopPropagation = function (event) {
              return function () {
                if (event[stopPropagation])
                  event[stopPropagation]()
                else
                  event.cancelBubble = true
              }
            }
          , createStop = function (synEvent) {
              return function () {
                synEvent[preventDefault]()
                synEvent[stopPropagation]()
                synEvent.stopped = true
              }
            }
          , copyProps = function (event, result, props) {
              var i, p
              for (i = props.length; i--;) {
                p = props[i]
                if (!(p in result) && p in event) result[p] = event[p]
              }
            }

        return function (event, isNative) {
          var result = { originalEvent: event, isNative: isNative }
          if (!event)
            return result

          var props
            , type = event.type
            , target = event[targetS] || event.srcElement

          result[preventDefault] = createPreventDefault(event)
          result[stopPropagation] = createStopPropagation(event)
          result.stop = createStop(result)
          result[targetS] = target && target.nodeType === 3 ? target.parentNode : target

          if (isNative) { // we only need basic augmentation on custom events, the rest is too expensive
            if (type.indexOf('key') !== -1) {
              props = keyProps
              result.keyCode = event.keyCode || event.which
            } else if (mouseTypeRegex.test(type)) {
              props = mouseProps
              result.rightClick = event.which === 3 || event.button === 2
              result.pos = { x: 0, y: 0 }
              if (event.pageX || event.pageY) {
                result.clientX = event.pageX
                result.clientY = event.pageY
              } else if (event.clientX || event.clientY) {
                result.clientX = event.clientX + doc.body.scrollLeft + root.scrollLeft
                result.clientY = event.clientY + doc.body.scrollTop + root.scrollTop
              }
              if (overOut.test(type))
                result.relatedTarget = event.relatedTarget || event[(type === 'mouseover' ? 'from' : 'to') + 'Element']
            } else if (touchTypeRegex.test(type)) {
              props = touchProps
            } else if (mouseWheelTypeRegex.test(type)) {
              props = mouseWheelProps
            } else if (textTypeRegex.test(type)) {
              props = textProps
            } else if (type === 'message') {
              props = messageProps
            }
            copyProps(event, result, props || commonProps)
          }
          return result
        }
      }())

      // if we're in old IE we can't do onpropertychange on doc or win so we use doc.documentElement for both
    , targetElement = function (element, isNative) {
        return !W3C_MODEL && !isNative && (element === doc || element === win) ? root : element
      }

      // we use one of these per listener, of any type
    , RegEntry = (function () {
        function entry(element, type, handler, original, namespaces) {
          var isNative = this.isNative = nativeEvents[type] && element[eventSupport]
          this.element = element
          this.type = type
          this.handler = handler
          this.original = original
          this.namespaces = namespaces
          this.custom = customEvents[type]
          this.eventType = W3C_MODEL || isNative ? type : 'propertychange'
          this.customType = !W3C_MODEL && !isNative && type
          this[targetS] = targetElement(element, isNative)
          this[eventSupport] = this[targetS][eventSupport]
        }

        entry.prototype = {
            // given a list of namespaces, is our entry in any of them?
            inNamespaces: function (checkNamespaces) {
              var i, j
              if (!checkNamespaces)
                return true
              if (!this.namespaces)
                return false
              for (i = checkNamespaces.length; i--;) {
                for (j = this.namespaces.length; j--;) {
                  if (checkNamespaces[i] === this.namespaces[j])
                    return true
                }
              }
              return false
            }

            // match by element, original fn (opt), handler fn (opt)
          , matches: function (checkElement, checkOriginal, checkHandler) {
              return this.element === checkElement &&
                (!checkOriginal || this.original === checkOriginal) &&
                (!checkHandler || this.handler === checkHandler)
            }
        }

        return entry
      }())

    , registry = (function () {
        // our map stores arrays by event type, just because it's better than storing
        // everything in a single array. uses '$' as a prefix for the keys for safety
        var map = {}

          // generic functional search of our registry for matching listeners,
          // `fn` returns false to break out of the loop
          , forAll = function (element, type, original, handler, fn) {
              if (!type || type === '*') {
                // search the whole registry
                for (var t in map) {
                  if (t.charAt(0) === '$')
                    forAll(element, t.substr(1), original, handler, fn)
                }
              } else {
                var i = 0, l, list = map['$' + type], all = element === '*'
                if (!list)
                  return
                for (l = list.length; i < l; i++) {
                  if (all || list[i].matches(element, original, handler))
                    if (!fn(list[i], list, i, type))
                      return
                }
              }
            }

          , has = function (element, type, original) {
              // we're not using forAll here simply because it's a bit slower and this
              // needs to be fast
              var i, list = map['$' + type]
              if (list) {
                for (i = list.length; i--;) {
                  if (list[i].matches(element, original, null))
                    return true
                }
              }
              return false
            }

          , get = function (element, type, original) {
              var entries = []
              forAll(element, type, original, null, function (entry) { return entries.push(entry) })
              return entries
            }

          , put = function (entry) {
              (map['$' + entry.type] || (map['$' + entry.type] = [])).push(entry)
              return entry
            }

          , del = function (entry) {
              forAll(entry.element, entry.type, null, entry.handler, function (entry, list, i) {
                list.splice(i, 1)
                if (list.length === 0)
                  delete map['$' + entry.type]
                return false
              })
            }

            // dump all entries, used for onunload
          , entries = function () {
              var t, entries = []
              for (t in map) {
                if (t.charAt(0) === '$')
                  entries = entries.concat(map[t])
              }
              return entries
            }

        return { has: has, get: get, put: put, del: del, entries: entries }
      }())

    , selectorEngine = doc[qSA]
        ? function (s, r) {
            return r[qSA](s)
          }
        : function () {
            throw new Error('Bean: No selector engine installed') // eeek
          }

    , setSelectorEngine = function (e) {
        selectorEngine = e
      }

      // add and remove listeners to DOM elements
    , listener = W3C_MODEL ? function (element, type, fn, add) {
        element[add ? addEvent : removeEvent](type, fn, false)
      } : function (element, type, fn, add, custom) {
        if (custom && add && element['_on' + custom] === null)
          element['_on' + custom] = 0
        element[add ? attachEvent : detachEvent]('on' + type, fn)
      }

    , nativeHandler = function (element, fn, args) {
        var beanDel = fn.__beanDel
          , handler = function (event) {
          event = fixEvent(event || ((this[ownerDocument] || this.document || this).parentWindow || win).event, true)
          if (beanDel) // delegated event, fix the fix
            event.currentTarget = beanDel.ft(event[targetS], element)
          return fn.apply(element, [event].concat(args))
        }
        handler.__beanDel = beanDel
        return handler
      }

    , customHandler = function (element, fn, type, condition, args, isNative) {
        var beanDel = fn.__beanDel
          , handler = function (event) {
          var target = beanDel ? beanDel.ft(event[targetS], element) : this // deleated event
          if (condition ? condition.apply(target, arguments) : W3C_MODEL ? true : event && event.propertyName === '_on' + type || !event) {
            if (event) {
              event = fixEvent(event || ((this[ownerDocument] || this.document || this).parentWindow || win).event, isNative)
              event.currentTarget = target
            }
            fn.apply(element, event && (!args || args.length === 0) ? arguments : slice.call(arguments, event ? 0 : 1).concat(args))
          }
        }
        handler.__beanDel = beanDel
        return handler
      }

    , once = function (rm, element, type, fn, originalFn) {
        // wrap the handler in a handler that does a remove as well
        return function () {
          rm(element, type, originalFn)
          fn.apply(this, arguments)
        }
      }

    , removeListener = function (element, orgType, handler, namespaces) {
        var i, l, entry
          , type = (orgType && orgType.replace(nameRegex, ''))
          , handlers = registry.get(element, type, handler)

        for (i = 0, l = handlers.length; i < l; i++) {
          if (handlers[i].inNamespaces(namespaces)) {
            if ((entry = handlers[i])[eventSupport])
              listener(entry[targetS], entry.eventType, entry.handler, false, entry.type)
            // TODO: this is problematic, we have a registry.get() and registry.del() that
            // both do registry searches so we waste cycles doing this. Needs to be rolled into
            // a single registry.forAll(fn) that removes while finding, but the catch is that
            // we'll be splicing the arrays that we're iterating over. Needs extra tests to
            // make sure we don't screw it up. @rvagg
            registry.del(entry)
          }
        }
      }

    , addListener = function (element, orgType, fn, originalFn, args) {
        var entry
          , type = orgType.replace(nameRegex, '')
          , namespaces = orgType.replace(namespaceRegex, '').split('.')

        if (registry.has(element, type, fn))
          return element // no dupe
        if (type === 'unload')
          fn = once(removeListener, element, type, fn, originalFn) // self clean-up
        if (customEvents[type]) {
          if (customEvents[type].condition)
            fn = customHandler(element, fn, type, customEvents[type].condition, args, true)
          type = customEvents[type].base || type
        }
        entry = registry.put(new RegEntry(element, type, fn, originalFn, namespaces[0] && namespaces))
        entry.handler = entry.isNative ?
          nativeHandler(element, entry.handler, args) :
          customHandler(element, entry.handler, type, false, args, false)
        if (entry[eventSupport])
          listener(entry[targetS], entry.eventType, entry.handler, true, entry.customType)
      }

    , del = function (selector, fn, $) {
            //TODO: findTarget (therefore $) is called twice, once for match and once for
            // setting e.currentTarget, fix this so it's only needed once
        var findTarget = function (target, root) {
              var i, array = typeof selector === 'string' ? $(selector, root) : selector
              for (; target && target !== root; target = target.parentNode) {
                for (i = array.length; i--;) {
                  if (array[i] === target)
                    return target
                }
              }
            }
          , handler = function (e) {
              var match = findTarget(e[targetS], this)
              match && fn.apply(match, arguments)
            }

        handler.__beanDel = {
            ft: findTarget // attach it here for customEvents to use too
          , selector: selector
          , $: $
        }
        return handler
      }

    , remove = function (element, typeSpec, fn) {
        var k, type, namespaces, i
          , rm = removeListener
          , isString = typeSpec && typeof typeSpec === 'string'

        if (isString && typeSpec.indexOf(' ') > 0) {
          // remove(el, 't1 t2 t3', fn) or remove(el, 't1 t2 t3')
          typeSpec = typeSpec.split(' ')
          for (i = typeSpec.length; i--;)
            remove(element, typeSpec[i], fn)
          return element
        }
        type = isString && typeSpec.replace(nameRegex, '')
        if (type && customEvents[type])
          type = customEvents[type].type
        if (!typeSpec || isString) {
          // remove(el) or remove(el, t1.ns) or remove(el, .ns) or remove(el, .ns1.ns2.ns3)
          if (namespaces = isString && typeSpec.replace(namespaceRegex, ''))
            namespaces = namespaces.split('.')
          rm(element, type, fn, namespaces)
        } else if (typeof typeSpec === 'function') {
          // remove(el, fn)
          rm(element, null, typeSpec)
        } else {
          // remove(el, { t1: fn1, t2, fn2 })
          for (k in typeSpec) {
            if (typeSpec.hasOwnProperty(k))
              remove(element, k, typeSpec[k])
          }
        }
        return element
      }

      // 5th argument, $=selector engine, is deprecated and will be removed
    , add = function (element, events, fn, delfn, $) {
        var type, types, i, args
          , originalFn = fn
          , isDel = fn && typeof fn === 'string'

        if (events && !fn && typeof events === 'object') {
          for (type in events) {
            if (events.hasOwnProperty(type))
              add.apply(this, [ element, type, events[type] ])
          }
        } else {
          args = arguments.length > 3 ? slice.call(arguments, 3) : []
          types = (isDel ? fn : events).split(' ')
          isDel && (fn = del(events, (originalFn = delfn), $ || selectorEngine)) && (args = slice.call(args, 1))
          // special case for one()
          this === ONE && (fn = once(remove, element, events, fn, originalFn))
          for (i = types.length; i--;) addListener(element, types[i], fn, originalFn, args)
        }
        return element
      }

    , one = function () {
        return add.apply(ONE, arguments)
      }

    , fireListener = W3C_MODEL ? function (isNative, type, element) {
        var evt = doc.createEvent(isNative ? 'HTMLEvents' : 'UIEvents')
        evt[isNative ? 'initEvent' : 'initUIEvent'](type, true, true, win, 1)
        element.dispatchEvent(evt)
      } : function (isNative, type, element) {
        element = targetElement(element, isNative)
        // if not-native then we're using onpropertychange so we just increment a custom property
        isNative ? element.fireEvent('on' + type, doc.createEventObject()) : element['_on' + type]++
      }

    , fire = function (element, type, args) {
        var i, j, l, names, handlers
          , types = type.split(' ')

        for (i = types.length; i--;) {
          type = types[i].replace(nameRegex, '')
          if (names = types[i].replace(namespaceRegex, ''))
            names = names.split('.')
          if (!names && !args && element[eventSupport]) {
            fireListener(nativeEvents[type], type, element)
          } else {
            // non-native event, either because of a namespace, arguments or a non DOM element
            // iterate over all listeners and manually 'fire'
            handlers = registry.get(element, type)
            args = [false].concat(args)
            for (j = 0, l = handlers.length; j < l; j++) {
              if (handlers[j].inNamespaces(names))
                handlers[j].handler.apply(element, args)
            }
          }
        }
        return element
      }

    , clone = function (element, from, type) {
        var i = 0
          , handlers = registry.get(from, type)
          , l = handlers.length
          , args, beanDel

        for (;i < l; i++) {
          if (handlers[i].original) {
            beanDel = handlers[i].handler.__beanDel
            if (beanDel) {
              args = [ element, beanDel.selector, handlers[i].type, handlers[i].original, beanDel.$]
            } else
              args = [ element, handlers[i].type, handlers[i].original ]
            add.apply(null, args)
          }
        }
        return element
      }

    , bean = {
          add: add
        , one: one
        , remove: remove
        , clone: clone
        , fire: fire
        , setSelectorEngine: setSelectorEngine
        , noConflict: function () {
            context[name] = old
            return this
          }
      }

  if (win[attachEvent]) {
    // for IE, clean up on unload to avoid leaks
    var cleanup = function () {
      var i, entries = registry.entries()
      for (i in entries) {
        if (entries[i].type && entries[i].type !== 'unload')
          remove(entries[i].element, entries[i].type)
      }
      win[detachEvent]('onunload', cleanup)
      win.CollectGarbage && win.CollectGarbage()
    }
    win[attachEvent]('onunload', cleanup)
  }

  return bean
})
;
define('modules/expandable',['common', 'bean'], function (common, bean) {

    var Expandable = function (opts) {

        var dom, // root element of the trailblock
            id = opts.id,
            expanded = (opts.hasOwnProperty('expanded')) ? expanded : true, // true = open, false = closed
            cta = document.createElement('span'),
            domCount,
            count;

        // View
        
        var view = {
           
            updateCallToAction: function () {
                cta.innerHTML = 'Show <span class="count">' + model.getCount() + '</span> ' + ((expanded) ? 'less' : 'more');
                cta.setAttribute('data-link-name', 'show ' + ((expanded) ? 'more' : 'less'));
            },
            
            renderState: function (expanded) {
                if(expanded) {
                    dom.removeClass('shut');
                } else {
                    dom.addClass('shut');
                }
            },
            
            renderCallToAction: function () {
                bean.add(cta, 'click', function (e) {
                    common.mediator.emit('modules:expandable:cta:toggle:' + id);
                });
                cta.className = 'cta expander b2';
                dom[0].appendChild(cta);
                view.updateCallToAction();
            }
        };
        
        // Model

        var model = {
        
            toggleExpanded: function (eventId) {
                expanded = (expanded) ? false : true;
                common.mediator.emit('modules:expandable:expandedChange:' + id, expanded);
            },

            getCount: function () {
                return dom.attr('data-count');
            },

            isOpen: function () {
                return (dom.hasClass('shut')) ? false : true;
            }
        };

        this.initalise = function () {
            dom = common.$g('#' + id);

            if (model.getCount() < 3) {
                return false;
            }

            view.renderCallToAction();
            view.renderState(expanded);
        };
        
        // Bindings
        

        // view listeners
        common.mediator.on('modules:expandable:expandedChange:' + id, view.renderState);
        common.mediator.on('modules:expandable:expandedChange:' + id, view.updateCallToAction);

        // model listeners
        common.mediator.on('modules:expandable:cta:toggle:' + id, model.toggleExpanded);

    };

    return Expandable;
   
});


/*! A fix for the iOS orientationchange zoom bug.
 Script by @scottjehl, rebound by @wilto.
 MIT / GPLv2 License.
*/
(function(w){
	
	// This fix addresses an iOS bug, so return early if the UA claims it's something else.
	var ua = navigator.userAgent;
	if( !( /iPhone|iPad|iPod/.test( navigator.platform ) && /OS [1-5]_[0-9_]* like Mac OS X/i.test(ua) && ua.indexOf( "AppleWebKit" ) > -1 ) ){
		return;
	}

    var doc = w.document;

    if( !doc.querySelector ){ return; }

    var meta = doc.querySelector( "meta[name=viewport]" ),
        initialContent = meta && meta.getAttribute( "content" ),
        disabledZoom = initialContent + ",maximum-scale=1",
        enabledZoom = initialContent + ",maximum-scale=10",
        enabled = true,
		x, y, z, aig;

    if( !meta ){ return; }

    function restoreZoom(){
        meta.setAttribute( "content", enabledZoom );
        enabled = true;
    }

    function disableZoom(){
        meta.setAttribute( "content", disabledZoom );
        enabled = false;
    }
	
    function checkTilt( e ){
		aig = e.accelerationIncludingGravity;
		x = Math.abs( aig.x );
		y = Math.abs( aig.y );
		z = Math.abs( aig.z );
				
		// If portrait orientation and in one of the danger zones
        if( (!w.orientation || w.orientation === 180) && ( x > 7 || ( ( z > 6 && y < 8 || z < 8 && y > 6 ) && x > 5 ) ) ){
			if( enabled ){
				disableZoom();
			}        	
        }
		else if( !enabled ){
			restoreZoom();
        }
    }
	
	w.addEventListener( "orientationchange", restoreZoom, false );
	w.addEventListener( "devicemotion", checkTilt, false );

})( this );
define("vendor/ios-orientationchange-fix",[], function(){});

define('modules/relativedates',['common'], function (common) {

    function dayOfWeek(day) {
        return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day];
    }
    
    function monthAbbr(month) {
        return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month];
    }
    
    function pad(n) {
        return n < 10 ? '0' + n : n;
    }
    
    function ampm(n) {
        return n < 12 ? 'am' : 'pm';
    }

    function twelveHourClock(hours) {
        return  hours > 12 ? hours - 12 : hours;
    }

    function isToday(date) {
        var today = new Date();
        return (date.toDateString() === today.toDateString());
    }

    function isYesterday(relative) {
        var today = new Date(),
            yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        return (relative.toDateString() === yesterday.toDateString());
    }

    function isValidDate(date) {
        if (Object.prototype.toString.call(date) !== "[object Date]") {
            return false;
        }
        return !isNaN(date.getTime());
    }

    function makeRelativeDate(epoch) {
        var then = new Date(Number(epoch)),
            now = new Date(),
            delta;

        if (!isValidDate(then)) {
            return false;
        }

        delta = parseInt((now.getTime() - then) / 1000, 10);

        if (delta < 0) {
            return false;

        } else if (delta < 55) {
            return 'less than a minute ago';

        } else if (delta < 90) {
            return 'about a minute ago';

        } else if (delta < (8 * 60)) {
            return 'about ' +
                (parseInt(delta / 60, 10)).toString(10) +
                ' minutes ago';

        } else if (delta < (55 * 60)) {
            return (parseInt(delta / 60, 10)).toString(10) +
                ' minutes ago';

        } else if (delta < (90 * 60)) {
            return 'about an hour ago';
        
        } else if (delta < (5 * 60 * 60)) {
            return 'about ' +
                (Math.round(delta / 3600)).toString(10) +
                ' hours ago';

        } else if (isToday(then)) {
            return 'Today, ' +
                twelveHourClock(then.getHours()) +
                ':' +
                pad(then.getMinutes()) +
                ampm(then.getHours());

        } else if (isYesterday(then)) { // yesterday
            return 'Yesterday, ' +
                twelveHourClock(then.getHours()) +
                ':' +
                pad(then.getMinutes()) +
                ampm(then.getHours());

        } else if (delta < 5 * 24 * 60 * 60) { // less than 5 days
            return [dayOfWeek(then.getDay()), then.getDate(), monthAbbr(then.getMonth()), then.getFullYear()].join(' ');

        } else {
            return [then.getDate(), monthAbbr(then.getMonth()), then.getFullYear()].join(' ');

        }
    }

    function findValidTimestamps() {
        var elms = document.querySelectorAll('.js-timestamp');
        return elms;
    }

    function replaceValidTimestamps() {
        var elms = findValidTimestamps();
        if (elms.length > 0) {
            for (var i = 0, l = elms.length; i < l; i++) {
                var e = elms[i];
                common.$g(e).removeClass('js-timestamp'); // don't check this again
                var timestamp = e.getAttribute('data-timestamp');
                
                var relativeDate = makeRelativeDate(timestamp);

                var prettyDate = e.innerText || e.textContent; // fix for old FF
                if (relativeDate) {
                    e.innerHTML = '<span title="' + prettyDate + '">' + relativeDate + '</span>';
                }
            }
        }
    }

    // bind to pubsub
    common.mediator.on('modules:relativedates:relativise', replaceValidTimestamps);
    common.mediator.on('modules:popular:render', replaceValidTimestamps);
    common.mediator.on('modules:related:render', replaceValidTimestamps);
    
    function init() {
        common.mediator.emit('modules:relativedates:relativise');
    }

    return {
        makeRelativeDate: makeRelativeDate,
        init: init
    };

});

define('modules/analytics/clickstream',['common', 'modules/detect', 'bean'], function (common, detect, bean) {

    var Clickstream = function (opts) {
     
            opts = opts || {};
            var filters = opts.filter || [];

        var filterSource = function (element) {
            return filters.filter(function (f) {
                return (f === element);
            });
        };
 
        var getTag = function (element, tag) {

            var elementName = element.tagName.toLowerCase(),
                dataLinkName = element.getAttribute("data-link-name");
            
            if (elementName === 'body') {
                return tag.reverse().join(' | ');
            }
            
            if (dataLinkName) {
                tag.push(dataLinkName);
            }

            return getTag(element.parentNode, tag);
        };

        // delegate, emit the derived tag
        bean.add(document.body, "click", function (event) {
            var target, dataIsXhr, href, isXhr, isInternalAnchor;

            if (filterSource(event.target.tagName.toLowerCase()).length > 0) {
                
                target = event.target; // possibly worth looking at tab.js' getTargetElement() - this is not x-browser
                dataIsXhr = target.getAttribute("data-is-ajax");
                href = target.getAttribute("href");
                 
                isXhr = (dataIsXhr) ? true : false;
                isInternalAnchor = (href && (href.indexOf('#') === 0)) ? true : false;

                common.mediator.emit('module:clickstream:click', [getTag(target, []), isXhr, isInternalAnchor]);
            } else {
                return false;
            }
        });
     
    };
    
    return (Clickstream);

});


define('modules/analytics/omniture',['common', 'modules/detect', 'bean'], function(common, detect, bean) {

    // https://developer.omniture.com/en_US/content_page/sitecatalyst-tagging/c-tagging-overview

    function Omniture(s, config) {

        var that = this;

        this.logView = function() {
            s.t();
        };
 
        this.logTag = function(params) {
            var tag = params[0],
                isXhr = params[1],
                isInternalAnchor = params[2];

            // this is confusing: if s.tl() first param is "true" then it *doesn't* delay.
            var delay = (isXhr || isInternalAnchor) ? true : false;
            that.populateEventProperties(tag);
            
            s.tl(delay, 'o', tag);
        };
    
        this.populateEventProperties = function(tag){
            s.linkTrackVars = 'eVar37,events';
            s.linkTrackEvents = 'event37';
            s.events = 'event37';
            s.eVar37 = s.pageType + ' | ' + tag;
        };

        this.populatePageProperties = function() {
       
            s.linkInternalFilters += ',localhost,gucode.co.uk,gucode.com,guardiannews.com,int.gnl,proxylocal.com';
        
            var webTitle = (config.page.webTitle || '').trim();
            if (webTitle.length > 72) {
                webTitle = webTitle.substring(0, 72);
            }
            s.pageName  = webTitle + ':' + (config.page.contentType || '') + ':' + (config.page.pageCode || '');
              
            s.pageType  = config.page.contentType || '';  //pageType
            s.prop9     = config.page.contentType || '';  //contentType
              
            s.channel   = config.page.section || '';
            s.prop4     = config.page.keywords || '';
            s.prop6     = config.page.author || '';
            s.prop8     = config.page.pageCode || '';
            s.prop10    = config.page.tones || '';

            s.prop11    = config.page.section || ''; //Third Level Mlc
            s.prop13    = config.page.series || '';
            s.prop25    = config.page.blogs || '';
                  
            s.prop14    = config.page.buildNumber || '';
              
            var platform = "frontend";
            s.prop19     = platform;
            s.eVar19     = platform;
                  
            s.prop47    = config.page.edition || '';

            s.prop48    = detect.getConnectionSpeed();

            s.prop56    = detect.getLayoutMode();
        
            if (config.page.webPublicationDate) {
                s.prop30 = 'content';
            } else {
                s.prop30 = 'non-content';
            }
        };

        this.init = function() {

            // must be set before the Omniture file is parsed
            window.s_account = config.page.omnitureAccount;
    
            var that = this;

            // if the omniture object was not injected in to the constructor
            // use the global 's' object

            if (s !== null) {
                that.populatePageProperties();
                that.logView();
                common.mediator.on('module:clickstream:click', that.logTag );
            } else {
                require(['omniture'], function(placeholder){
                    s = window.s;
                    that.populatePageProperties();
                    that.logView();
                    common.mediator.on('module:clickstream:click', that.logTag );
                });
            }
        };
     
    }
    
    return Omniture;

});


define('modules/tabs',['common', 'bean', 'bonzo', 'qwery'], function (common, bean, bonzo, qwery) {

    /*
        expects the following HTML structure

        <ol class="tabs">
            <li class="tabs-selected"><a href="#foo">Foo</a></li>
            <li><a href="#bar">Bar</a></li>
        </ol>

        <div class="tabs-content">
             <div class="tabs-pane" id="foo">foo</div>
             <div class="tabs-pane initially-off" id="bar">bar</div>
        </div>
    
    */

    var Tabs = function (options) {

        var view = {

            showTab: function (tabSet, clickedTab, originalEvent) {
            
                // find the active tab in the set. returns an array of 1 item, hence [0]
                var currentTab = common.$g('.tabs-selected a', tabSet)[0];
                
                // trim the leading # and find the matching panel element
                var paneToShow = document.getElementById(clickedTab.getAttribute('href').substring(1));
                var paneToHide = document.getElementById(currentTab.getAttribute('href').substring(1));
                    
                // show hide stuff
                bonzo(currentTab.parentNode).removeClass('tabs-selected');
                bonzo(clickedTab.parentNode).addClass('tabs-selected');
                bonzo(paneToHide).hide();
                bonzo(paneToShow).removeClass('initially-off').show();

                // only do this if we know the href was a tab ID, not a URL
                originalEvent.preventDefault();
            
            }
        };

        var model = {

            // x-brower way of grabbing clicked element
            getTargetElement: function (event) {
                var target;
        
                if (!event) { return; }

                if (event.target) { // modern browsers
                    target = event.target;
                } else if (event.srcElement) { // IE
                    target = event.srcElement;
                }

                // safari bug (returns textnode, not element)
                if (target.nodeType === 3) {
                    target = target.parentNode;
                }

                return target;
            }

        };

        this.init = function (tabSelector) {

            if (!tabSelector) {
                tabSelector = 'ol.tabs';
            }
    
            var ols = common.$g(tabSelector).each(function (tabSet) {
                bean.add(tabSet, 'click', function (e) {
                    var targetElm = model.getTargetElement(e);
                    // if we use tabSet instead of this, it sets all tabs to use the last set in the loop
                    var tabContainer = targetElm.parentNode.parentNode;
                    // verify they clicked an <a> element
                    if (targetElm.nodeName.toLowerCase() === "a") {
                        view.showTab(tabContainer, targetElm, e);
                    }
                });
            });
        };

        // Bindings
        
        common.mediator.on('modules:tabs:render', this.init);

    };

    return Tabs;

});

/*jshint loopfunc: true */
define('modules/fonts',['reqwest', 'common'], function (reqwest, common) {

    function Fonts(styleNodes, fileFormat) {

        this.styleNodes = styleNodes;
        this.fileFormat = fileFormat;
        this.reqwest = reqwest; // expose publicly so we can inspect it in unit tests

        function fontIsRequired(style) {
            // A final check for localStorage.
            // Because it would be horrible if people downloaded fonts and then couldn't cache them.
            try {
                localStorage.setItem('test', 'test1');
                localStorage.removeItem('test');
                return (localStorage.getItem(Fonts.storagePrefix + style.getAttribute('data-cache-name')) === null);
            }
            catch (e) {
                return false;
            }
        }

        this.loadFromServer = function (url, callback) {

            // If no URL, then load from standard static assets path.
            url = url || '';

            for (var i = 0, j = this.styleNodes.length; i < j; ++i) {
                var style = this.styleNodes[i];
                if (fontIsRequired(style)) {
                    this.reqwest({
                        url: url + style.getAttribute('data-cache-file-' + this.fileFormat),
                        type: 'jsonp',
                        jsonpCallbackName: 'guFont',
                        success: (function (style) {
                            return function (json) {
                                if (typeof callback === 'function') {
                                    callback(style, json);
                                }
                                localStorage.setItem(Fonts.storagePrefix + style.getAttribute('data-cache-name'), json.css);
                                common.mediator.emit('modules:fonts:loaded', [json.name]);
                            };
                        }(style))
                    });
                } else {
                    common.mediator.emit('modules:fonts:notloaded', []);
                }
            }
        };

        this.loadFromServerAndApply = function (url) {
            var html = document.querySelector('html');
            this.loadFromServer(url, function (style, json) {
                style.innerHTML = json.css;
                if (html.className.indexOf('font-' + json.name + '-loaded') < 0) {
                    html.className += ' font-' + json.name + '-loaded';
                }
            });
        };

    }

    Fonts.storagePrefix = "_guFont:";
    
    Fonts.clearFontsFromStorage = function () {
        // Loop in reverse because localStorage indexes will change as you delete items.
        for (var i = localStorage.length - 1; i > -1; --i) {
            var name = localStorage.key(i);
            if (name.indexOf(Fonts.storagePrefix) === 0) {
                localStorage.removeItem(name);
            }
        }
    };

    return Fonts;

});

define('modules/navigation/top-stories.js',['common', 'reqwest', 'bonzo'], function (common, reqwest, bonzo) {

    function Navigation() {
        
        // View
        
        this.view = {
        
            render: function (html) {
                var topstoriesHeader, topstoriesFooter, topstoriesNav, i, l, elm;

                topstoriesHeader = document.getElementById('topstories-header');
                topstoriesFooter = document.getElementById('topstories-footer');
                topstoriesNav = common.$g('.topstories-control');

                topstoriesHeader.innerHTML = html;
                topstoriesFooter.innerHTML = html;

                //  show the initially-hidden top stories nav link
                for (i = 0, l = topstoriesNav.length; i < l; i++) {
                    elm = topstoriesNav[i];
                    bonzo(elm).removeClass('initially-off');
                }

                common.mediator.emit('modules:navigation:render');
            }
        
        };

        // Bindings
        
        common.mediator.on('modules:navigation:loaded', this.view.render);
        
        // Model
        
        this.load = function (config) {
            var latestUrl = config.page.coreNavigationUrl + '/top-stories/' + config.page.edition;
            
            return reqwest({
                    url: latestUrl,
                    type: 'jsonp',
                    jsonpCallback: 'callback',
                    jsonpCallbackName: 'navigation',
                    success: function (json) {
                        common.mediator.emit('modules:navigation:loaded', [json.html]);
                    }
                });
        };

    }
    
    return Navigation;

});

define('modules/navigation/controls.js',['common', 'bean', 'bonzo'], function (common, Bean, bonzo) {
    var Navigation;

    Navigation = function (opts) {
        var toggles, view, model;
       
        // View
        
        view = {

            toggle: function (state, position, elm) {
                var item, altItem;

                item = bonzo(document.getElementById(((state === "sections") ? "sections-" + position : "topstories-" + position)));
                altItem = bonzo(document.getElementById(((state === "sections") ?  "topstories-" + position : "sections-" + position)));

                if (altItem.hasClass('on')) { // the "other" panel is visible, so hide it then show current
                    altItem.toggleClass('on initially-off');
                }

                if (item.hasClass('initially-off')) {
                    item.toggleClass('on initially-off');
                } else if (item.hasClass('on')) {
                    item.toggleClass('on initially-off');
                }

                return (state);
            },

            // this menu is on by default for non-JS users, so we hide it once JS is loaded
            hideBottomMenu: function () {
                var bottomMenu = document.getElementById('sections-footer');
                bonzo(bottomMenu).addClass('initially-off');
            },

            // we don't show the bottom section icon unless JS is enabled,
            // since it doesn't do anything at the footer
            // so we show it here since JS is on
            showHiddenSectionControls: function () {
                var navItems = common.$g('.sections-control'), i, l, elm;
                 for (i = 0, l = navItems.length; i < l; i++) {
                    elm = navItems[i];
                    bonzo(elm).removeClass('initially-off');
                }
            },

            init: function () {

                view.hideBottomMenu();

                view.showHiddenSectionControls();

                // can't seem to get bean to bind on arrays of elements properly,
                // and doing it inside loops does weird closure-related things. ugh.

                Bean.add(document.getElementById('sections-control-header'), 'click touchstart', function (e) {
                    var elm = this;
                    view.toggle('sections', 'header', elm);
                    e.preventDefault();
                });

                Bean.add(document.getElementById('sections-control-footer'), 'click touchstart', function (e) {
                    var elm = this;
                    view.toggle('sections', 'footer', elm);
                    e.preventDefault();
                });
                
                Bean.add(document.getElementById('topstories-control-header'), 'click touchstart', function (e) {
                    var elm = this;
                    view.toggle('topstories', 'header', elm);
                    e.preventDefault();
                });

                Bean.add(document.getElementById('topstories-control-footer'), 'click touchstart', function (e) {
                    var elm = this;
                    view.toggle('topstories', 'footer', elm);
                    e.preventDefault();
                });

            }
                    
        };

        // Model

        model = {
        };
        
        this.initialise = function () {
            view.init();
        };
    };


    return Navigation;
   
});


/**
 * @license RequireJS domReady 2.0.1 Copyright (c) 2010-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/requirejs/domReady for details
 */
/*jslint */
/*global require: false, define: false, requirejs: false,
  window: false, clearInterval: false, document: false,
  self: false, setInterval: false */


define('domReady',[],function () {
    

    var isTop, testDiv, scrollIntervalId,
        isBrowser = typeof window !== "undefined" && window.document,
        isPageLoaded = !isBrowser,
        doc = isBrowser ? document : null,
        readyCalls = [];

    function runCallbacks(callbacks) {
        var i;
        for (i = 0; i < callbacks.length; i += 1) {
            callbacks[i](doc);
        }
    }

    function callReady() {
        var callbacks = readyCalls;

        if (isPageLoaded) {
            //Call the DOM ready callbacks
            if (callbacks.length) {
                readyCalls = [];
                runCallbacks(callbacks);
            }
        }
    }

    /**
     * Sets the page as loaded.
     */
    function pageLoaded() {
        if (!isPageLoaded) {
            isPageLoaded = true;
            if (scrollIntervalId) {
                clearInterval(scrollIntervalId);
            }

            callReady();
        }
    }

    if (isBrowser) {
        if (document.addEventListener) {
            //Standards. Hooray! Assumption here that if standards based,
            //it knows about DOMContentLoaded.
            document.addEventListener("DOMContentLoaded", pageLoaded, false);
            window.addEventListener("load", pageLoaded, false);
        } else if (window.attachEvent) {
            window.attachEvent("onload", pageLoaded);

            testDiv = document.createElement('div');
            try {
                isTop = window.frameElement === null;
            } catch (e) {}

            //DOMContentLoaded approximation that uses a doScroll, as found by
            //Diego Perini: http://javascript.nwbox.com/IEContentLoaded/,
            //but modified by other contributors, including jdalton
            if (testDiv.doScroll && isTop && window.external) {
                scrollIntervalId = setInterval(function () {
                    try {
                        testDiv.doScroll();
                        pageLoaded();
                    } catch (e) {}
                }, 30);
            }
        }

        //Check if document already complete, and if so, just trigger page load
        //listeners. Latest webkit browsers also use "interactive", and
        //will fire the onDOMContentLoaded before "interactive" but not after
        //entering "interactive" or "complete". More details:
        //http://dev.w3.org/html5/spec/the-end.html#the-end
        //http://stackoverflow.com/questions/3665561/document-readystate-of-interactive-vs-ondomcontentloaded
        //Hmm, this is more complicated on further use, see "firing too early"
        //bug: https://github.com/requirejs/domReady/issues/1
        //so removing the || document.readyState === "interactive" test.
        //There is still a window.onload binding that should get fired if
        //DOMContentLoaded is missed.
        if (document.readyState === "complete") {
            pageLoaded();
        }
    }

    /** START OF PUBLIC API **/

    /**
     * Registers a callback for DOM ready. If DOM is already ready, the
     * callback is called immediately.
     * @param {Function} callback
     */
    function domReady(callback) {
        if (isPageLoaded) {
            callback(doc);
        } else {
            readyCalls.push(callback);
        }
        return domReady;
    }

    domReady.version = '2.0.1';

    /**
     * Loader Plugin API method
     */
    domReady.load = function (name, req, onLoad, config) {
        if (config.isBuild) {
            onLoad(null);
        } else {
            domReady(onLoad);
        }
    };

    /** END OF PUBLIC API **/

    return domReady;
});
define('bootstraps/article',[
        'common',
        'modules/related',
        'modules/images',
        'modules/popular',
        'modules/expandable',
        'vendor/ios-orientationchange-fix',
        'modules/relativedates',
        'modules/analytics/clickstream',
        'modules/analytics/omniture',
        'modules/tabs',
        'modules/fonts',
        'qwery',
        'modules/detect',
        'modules/navigation/top-stories.js',
        'modules/navigation/controls.js',
        'domReady'
    ],
    function (
        common,
        Related,
        Images,
        Popular,
        Expandable,
        Orientation,
        RelativeDates,
        Clickstream,
        Omniture,
        Tabs,
        Fonts,
        qwery,
        detect,
        TopStories,
        NavigationControls,
        domReady) {

        var modules = {

            isNetworkFront: false, // use this to disable some functions for NF

            setNetworkFrontStatus: function(status) {
                this.isNetworkFront = (status === "") ? true : false;
            },

            upgradeImages: function () {
                var i = new Images();
                i.upgrade();
            },

            transcludeNavigation: function (config) {
                new NavigationControls().initialise();

                // only do this for homepage
                if (!this.isNetworkFront) {
                    new TopStories().load(config);
                }

            },

            transcludeRelated: function (host, pageId) {
                var url =  host + '/related/UK/' + pageId,
                     hasStoryPackage = !document.getElementById('js-related'),
                     relatedExpandable = new Expandable({ id: 'related-trails', expanded: false });
               
                if (hasStoryPackage) {
                    relatedExpandable.initalise();
                }
                
                if (!hasStoryPackage) {
                    common.mediator.on('modules:related:render', relatedExpandable.initalise);
                    new Related(document.getElementById('js-related')).load(url);
                }
            },

            transcludeMostPopular: function (host, section) {

                if (this.isNetworkFront) { return false; }

                var url = host + '/most-popular/UK/' + section,
                    domContainer = document.getElementById('js-popular');

                new Popular(domContainer).load(url);
                
                common.mediator.on('modules:popular:render', function () {
                    common.mediator.emit('modules:tabs:render', '#js-popular-tabs');
                    qwery('.trailblock', domContainer).forEach(function (tab) {
                        var popularExpandable = new Expandable({ id: tab.id, expanded: false });
                        common.mediator.on('modules:popular:render', popularExpandable.initalise);
                    });
                });
            },

            loadFonts: function(config, ua, prefs) {
                var fileFormat = detect.getFontFormatSupport(ua),
                    fontStyleNodes = document.querySelectorAll('[data-cache-name].initial');
                if (config.switches.fontFamily && prefs.exists('font-family')) {
                    new Fonts(fontStyleNodes, fileFormat).loadFromServerAndApply();
                } else {
                    Fonts.clearFontsFromStorage();
                }
            },

            showRelativeDates: function () {
                RelativeDates.init();
            },

            loadOmnitureAnalytics: function (config) {
                var cs = new Clickstream({ filter: ["a", "span"] }),
                    o = new Omniture(null, config).init();
            },

            loadOphanAnalytics: function () {
                require(['http://s.ophan.co.uk/js/t6.min.js'], function (ophan) {});
            },

            showTabs: function () {
                var tabs = new Tabs().init();
            }
         
        };

    var bootstrap = function (config, userPrefs) {
        modules.setNetworkFrontStatus(config.page.pageId);
        modules.upgradeImages();
        modules.transcludeRelated(config.page.coreNavigationUrl, config.page.pageId);
        modules.transcludeMostPopular(config.page.coreNavigationUrl, config.page.section);
        modules.showRelativeDates();
        modules.showTabs();
        modules.transcludeNavigation(config);
        modules.loadOmnitureAnalytics(config);
        modules.loadFonts(config, navigator.userAgent, userPrefs);
        modules.loadOphanAnalytics();
    };

    // domReady proxy for bootstrap
    var domReadyBootstrap = function (config, userPrefs) {
        domReady(function () {
            bootstrap(config, userPrefs);
        });
    };

    return {
        go: domReadyBootstrap
    };

});