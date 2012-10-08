
Theory
------

- We have two bootstraps, one for pre-domReady & one for post-domReady code
- We produce both from the r.js optimiser
- We use almond to inline the pre-domReady bootstrap in to the page so it's executed inline (ie. in <head>)
- We use almond's basic require()/define() implementation to load the second bootstrap (ie. article.js) *after* domReady is fired

Why?
----

- This gives us fast, non-blocking access to properties that are present before the DOM has loaded (Eg, localstorage)
- ... and defers all the dom-dependent stuff to later (as it currently is)
- We use a simple AMD loader designed for AMD modules that have been compiled (Almond is 1kb)

Problems
--------

- The shared modules (Eg, common) appear in both the almond and article bootstraps

