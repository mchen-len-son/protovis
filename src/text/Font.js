(function(){
    
    var _cache;
    
    pv.Text = {};
    
    pv.Text.createCache = function(){
        return new FontSizeCache();
    };
    
    pv.Text.usingCache = function(cache, fun, ctx){
        if(!(cache instanceof FontSizeCache)){
            throw new Error("Not a valid cache.");
        }
        
        var prevCache = _cache;
        
        _cache = cache;
        try{
            return fun.call(ctx);
        } finally {
            _cache = prevCache;
        }
    };
    
    pv.Text.measure = function(text, font){
        if(text == null){
            text = "";
        } else {
            text = "" + text;
        }
        
        var bbox = _cache && _cache.get(font, text);
        if(!bbox){
            if(!text){
                bbox = {width: 0, height: 0};
            } else {
                bbox = this.measureCore(text, font);
            }
            
            if(_cache){
                _cache.put(font, text, bbox);
            }
        }
        
        return bbox;
    };
    
    pv.Text.fontHeight = function(font){
        return pv.Text.measure('M', font).height;
    };
    
    // Replace with another custom implementation if necessary
    pv.Text.measureCore = (function(){
        
        // SVG implementation
        var _svgText, _lastFont = '10px sans-serif';
        
        function getTextSizeElement(){
            return _svgText || (_svgText = createTextSizeElement());
        }
        
        function createTextSizeElement(){
            var div =  document.createElement('div');
            div.id = 'pvSVGText_' + new Date().getTime();
            
            var style = div.style;
            style.position   = 'absolute';
            style.visibility = 'hidden';
            style.width  = 0;
            style.height = 0;
            style.left = 0;
            style.top  = 0;
            
            var svgElem = pv.SvgScene.create('svg');
            svgElem.setAttribute('font', _lastFont);
            div.appendChild(svgElem);
            
            
            var svgText = pv.SvgScene.create('text');
            svgElem.appendChild(svgText);
            
            var textNode;
            if (pv.renderer() === "svgweb") { 
                // SVGWeb needs an extra 'true' to create SVG text nodes properly in IE.
                textNode = document.createTextNode('', true);
            } else {
                textNode = document.createTextNode('');
            }
            svgText.appendChild(textNode);
            
            document.body.appendChild(div);
            
            return svgText;
        }
        
        return function(text, font){
            if(!font){ font = null; }
            
            var svgText = getTextSizeElement();
            if(_lastFont !== font){
                _lastFont = font;
                pv.SvgScene.setStyle(svgText, {'font': font});
            }
            
            svgText.firstChild.nodeValue = '' + text;
            
            var box;
            try{
                box = svgText.getBBox();
            } catch(ex){
                if(typeof console.error === 'function'){
                    console.error("GetBBox failed: ", ex);
                }
                
                throw ex;
            }
            
            return {width: box.width, height: box.height};
        };
    }());
    
    // --------
    
    var FontSizeCache = function(){
        this._fontsCache = {};
    };
    
    var hasOwnProp = Object.prototype.hasOwnProperty;
    
    FontSizeCache.prototype._getFont = function(font){
        font = font || '';
        return hasOwnProp.call(this._fontsCache, font) ?
               this._fontsCache[font] :
               (this._fontsCache[font] = {});
    };
        
    FontSizeCache.prototype.get = function(font, text){
        text = text || '';
        
        var fontCache = this._getFont(font);
        return hasOwnProp.call(fontCache, text) ?
               fontCache[text] :
               null;
    };
        
    FontSizeCache.prototype.put = function(font, text, size){
        return this._getFont(font)[text||''] = size;
    };
        
}());