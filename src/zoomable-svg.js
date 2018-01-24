import dragTracker from './vendor/drag-tracker';


function zoomableSvg(svg, options) {
    
    /* Utils */
    
    function relativeMousePos(mouseEvent, element, stayWithin) {
        function respectBounds(value, min,max) { return Math.max(min, Math.min(value, max)); }
        const elmBounds = element.getBoundingClientRect();
        let x = mouseEvent.clientX - elmBounds.left, y = mouseEvent.clientY - elmBounds.top;
        if(stayWithin) { x = respectBounds(x, 0, elmBounds.width); y = respectBounds(y, 0, elmBounds.height); }
        return { x: x, y: y };
    }
    
    function Coord(x, y) { this.x = x; this.y = y; }
    Coord.prototype.negate = function() { return new Coord(-this.x, -this.y); };
    Coord.prototype.subtract = function(c2) { return new Coord(this.x - c2.x, this.y - c2.y); };

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


export default zoomableSvg;
