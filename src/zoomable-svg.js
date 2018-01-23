function zoomableSvg(svg, options) {
    
    /* Utils */
    
    function relativeMousePos(mouseEvent, element, stayWithin) {
        function respectBounds(value, min,max) { return Math.max(min, Math.min(value, max)); }
        const elmBounds = element.getBoundingClientRect(), x = mouseEvent.clientX - elmBounds.left, y = mouseEvent.clientY - elmBounds.top;
        if(stayWithin) { x = respectBounds(x, 0, elmBounds.width); y = respectBounds(y, 0, elmBounds.height); }
        return { x: x, y: y };
    }
    
    function Coord(x, y) { this.x = x; this.y = y; }
    Coord.prototype.negate = function() { return new Coord(-this.x, -this.y); };
    Coord.prototype.subtract = function(c2) { return new Coord(this.x - c2.x, this.y - c2.y); };

    /*
        https://github.com/Sphinxxxx/drag-tracker    
    
        MIT License
        Copyright (c) 2017 Andreas Borgen
    */
    function dragTracker(d){function k(a,b,d,e){var c=a.clientX;a=a.clientY;if(b){var f=b.getBoundingClientRect();c-=f.left;a-=f.top;d&&(c-=d[0],a-=d[1]);e&&(c=Math.max(0,Math.min(c,f.width)),a=Math.max(0,Math.min(a,f.height)));b!==g&&(null!==l?l:"circle"===b.nodeName||"ellipse"===b.nodeName)&&(c-=f.width/2,a-=f.height/2)}return u?[Math.round(c),Math.round(a)]:[c,a]}function v(a){if(e=n?a.target.closest(n):{})a.preventDefault(),a.stopPropagation(),m=n&&w?k(a,e):[0,0],c=k(a,g,m),u&&(c=c.map(Math.round)),
    x&&x(e,c)}function y(a){e&&(a.preventDefault(),a.stopPropagation(),a=k(a,g,m,!z),B(e,a,c))}function h(a){if(e){if(p||q)a=k(a,g,m,!z),q&&c[0]===a[0]&&c[1]===a[1]&&q(e,c),p&&p(e,a,c);e=null}}function A(a){h(r(a))}function t(a){return void 0!==a.buttons?1===a.buttons:1===a.which}function r(a){var b=a.targetTouches[0];b||(b=a.changedTouches[0]);b.preventDefault=a.preventDefault.bind(a);b.stopPropagation=a.stopPropagation.bind(a);return b}var f=Element.prototype;f.matches||(f.matches=f.msMatchesSelector||
    f.webkitMatchesSelector);f.closest||(f.closest=function(a){var b=this;do{if(b.matches(a))return b;b="svg"===b.tagName?b.parentNode:b.parentElement}while(b);return null});d=d||{};var g=d.container||document.documentElement,n=d.selector,B=d.callback||console.log,x=d.callbackDragStart,p=d.callbackDragEnd,q=d.callbackClick,u=!1!==d.roundCoords,z=!1!==d.dragOutside,w=d.handleOffset||!1!==d.handleOffset,l=null;switch(w){case "center":l=!0;break;case "topleft":case "top-left":l=!1}var e,m,c;g.addEventListener("mousedown",
    function(a){t(a)&&v(a)});g.addEventListener("touchstart",function(a){1!==a.touches.length?h(a):v(r(a))});window.addEventListener("mousemove",function(a){e&&(t(a)?y(a):h(a))});window.addEventListener("touchmove",function(a){1!==a.touches.length?h(a):y(r(a))});window.addEventListener("mouseup",function(a){e&&!t(a)&&h(a)});g.addEventListener("touchend",A);g.addEventListener("touchcancel",A)}

    /* /Utils */


    if(typeof(svg) === 'string') { svg = document.querySelector(svg); }
    options = options || {};
    
    let _ui = options.container || svg,
        _dragOffset,
        _pinchState,
        _zoom,
        _viewport = {
            width: _ui.clientWidth,
            height: _ui.clientHeight
        },
        _viewBox = (function parseVB(vbAttr) {
            const vb = vbAttr && vbAttr.split(/[ ,]/)
                                        .filter(x => x.length)
                                        .map(x => Number(x));
            if(vb && (vb.length === 4)) {
                return {
                    left: vb[0],
                    top: vb[1],
                    width: vb[2],
                    height: vb[3]
                };
            }
        })(svg.getAttribute('viewBox'));
    
    const _public = {
        getViewBox: getViewBox,
        getZoom: function() { return _zoom; },
        vp2vb: vp2vb
    };

    if(_viewBox) {
        //Adjust the zoom in case the SVG has been resized via CSS:
        _zoom = _viewport.width/_viewBox.width;
        //If the SVG is inside a container, adjust the SVG's viewBox to the container's aspect ratio,
        //or else vp2vb() calculations won't be accurate:
        if(options.container) {
            changeZoom(0, new Coord(0,0));
        }
    }
    else {
        _zoom = 1;
        _viewBox = {
            left: 0,
            top: 0,
            width: _viewport.width,
            height: _viewport.height
        };
        updateViewBox();
    }
    
    //Zoom
    _ui.addEventListener('wheel', function(e) {
        e.preventDefault();
        changeZoom((e.deltaY > 0) ? -.1 : .1, relativeMousePos(e, _ui));
    });
    _ui.addEventListener('touchmove', function(te) {
        var touches = te.touches; //touchEvent.targetTouches;
        if(touches.length !== 2) {
            _pinchState = null;
            return;
        }
        te.preventDefault();
        //console.log(touches[0].identifier, touches[1].identifier);

        const p1 = relativeMousePos(touches[0], _ui),
              p2 = relativeMousePos(touches[1], _ui),
              dx = p1.x - p2.x,
              dy = p1.y - p2.y,
              pinch = {
                  center: new Coord((p1.x + p2.x)/2, (p1.y + p2.y)/2),
                  dist: Math.sqrt(dx*dx + dy*dy),
              };

        if(_pinchState) {
            moveViewport(pinch.center.subtract(_pinchState.center));
            changeZoom((pinch.dist/_pinchState.dist) - 1, pinch.center);
        }
        _pinchState = pinch;
    });
    _ui.addEventListener('touchend', function (te) {
        _pinchState = null;
    });
    
    //Drag
    dragTracker({
        container: _ui,
        //selector: ...,
        callbackDragStart: (_, pos) => {
            _dragOffset = pos;
        },
        callback: (_, pos, start) => {
            moveViewport(new Coord(pos[0] - _dragOffset[0], pos[1] - _dragOffset[1]));
            _dragOffset = pos;
        },
        callbackDragEnd: () => {
            _dragOffset = null;
        }
    });

    function changeZoom(delta, viewportCenter) {
        //console.log(delta, center);
        _zoom *= 1 + delta;
        setZoom(_zoom, viewportCenter);
    }
    function setZoom(zoom, viewportCenter) {
        var newVBW = _viewport.width/zoom,
            newVBH = _viewport.height/zoom,
            newVBTopLeft;

        var resizeFactor = newVBW/_viewBox.width,
            newVPRect = {
                w: _viewport.width * resizeFactor,
                h: _viewport.height * resizeFactor,
                t: viewportCenter.y - (viewportCenter.y * resizeFactor),
                l: viewportCenter.x - (viewportCenter.x * resizeFactor),
            };

        newVBTopLeft = vp2vb( new Coord(newVPRect.l, newVPRect.t) );

        _viewBox.top = newVBTopLeft.y;
        _viewBox.left = newVBTopLeft.x;
        _viewBox.width = newVBW;
        _viewBox.height = newVBH;

        //console.log(zoom, newVPRect, _viewBox);
        updateViewBox();
    }

    function moveViewport(viewportDelta) {
        var vbDelta = vp2vb(viewportDelta.negate());
        _viewBox.top  = vbDelta.y;
        _viewBox.left = vbDelta.x;

        //console.log(viewportDelta, vbDelta);
        updateViewBox();
    }
    //Viewport coordinate -> viewBox coordinate:
    function vp2vb(vpCoord) {
        var relX = vpCoord.x/_viewport.width,
            relY = vpCoord.y/_viewport.height,

            vbX = _viewBox.width *relX + _viewBox.left,
            vbY = _viewBox.height*relY + _viewBox.top,

            vbCoord = new Coord(vbX, vbY);

        //console.log(_viewBox, [relX, relY], '->', vbCoord);
        return vbCoord;
    }
    function getViewBox() {
        return [_viewBox.left, _viewBox.top, _viewBox.width, _viewBox.height];
    }
    function updateViewBox() {
        const viewBox = getViewBox();
        
        svg.setAttribute('viewBox', viewBox);
        if(options.onChanged) { options.onChanged.call(_public); }
    }
    
    return _public;
}
