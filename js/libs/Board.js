'use strict'
var setting = {
  maxSpaceSize: 6,
  minSpaceSize: 0.5,
};
const FILL = 0; // const to indicate filltext render
const STROKE = 1;
const MEASURE = 2;
var renderType = FILL; // used internal to set fill or stroke text

var maxSpaceSize = 3; // Multiplier for max space size. If greater then no justificatoin applied
var minSpaceSize = 0.5; // Multiplier for minimum space size
var renderTextJustified = function (ctx, text, x, y, width) {
  var words,
    wordsWidth,
    count,
    spaces,
    spaceWidth,
    adjSpace,
    renderer,
    i,
    textAlign,
    useSize,
    totalWidth;
  textAlign = ctx.textAlign; // get current align settings
  ctx.textAlign = "left";
  wordsWidth = 0;
  words = text.split(" ").map((word) => {
    var w = ctx.measureText(word).width;
    wordsWidth += w;
    return {
      width: w,
      word: word,
    };
  });
  // count = num words, spaces = number spaces, spaceWidth normal space size
  // adjSpace new space size >= min size. useSize Resulting space size used to render
  count = words.length;
  spaces = count - 1;
  spaceWidth = ctx.measureText(" ").width;
  adjSpace = Math.max(
    spaceWidth * minSpaceSize,
    (width - wordsWidth) / spaces
  );
  useSize = adjSpace > spaceWidth * maxSpaceSize ? spaceWidth : adjSpace;
  totalWidth = wordsWidth + useSize * spaces;
  if (renderType === MEASURE) {
    // if measuring return size
    ctx.textAlign = textAlign;
    return totalWidth;
  }
  renderer =
    renderType === FILL
      ? ctx.fillText.bind(ctx)
      : ctx.strokeText.bind(ctx); // fill or stroke
  switch (textAlign) {
    case "right":
      x -= totalWidth;
      break;
    case "end":
      x += width - totalWidth;
      break;
    case "center": // intentional fall through to default
      x -= totalWidth / 2;
    default:
  }
  if (useSize === spaceWidth) {
    // if space size unchanged
    renderer(text, x, y);
  } else {
    for (i = 0; i < count; i += 1) {
      renderer(words[i].word, x, y);
      x += words[i].width;
      x += useSize;
    }
  }
  ctx.textAlign = textAlign;
};
var justifiedTextSettings = function (settings) {
  var min, max;
  var vetNumber = (num, defaultNum) => {
    num = num !== null && num !== null && !isNaN(num) ? num : defaultNum;
    if (num < 0) {
      num = defaultNum;
    }
    return num;
  };
  if (settings === undefined || settings === null) {
    return;
  }
  max = vetNumber(settings.maxSpaceSize, maxSpaceSize);
  min = vetNumber(settings.minSpaceSize, minSpaceSize);
  if (min > max) {
    return;
  }
  minSpaceSize = min;
  maxSpaceSize = max;
};
// define fill text
var fillJustifyText = function (text, x, y, width, settings) {
  justifiedTextSettings(settings);
  renderType = FILL;
  renderTextJustified(this, text, x, y, width);
};
// define stroke text
var strokeJustifyText = function (text, x, y, width, settings) {
  justifiedTextSettings(settings);
  renderType = STROKE;
  renderTextJustified(this, text, x, y, width);
};
// define measure text
var measureJustifiedText = function (text, width, settings) {
  justifiedTextSettings(settings);
  renderType = MEASURE;
  return renderTextJustified(this, text, 0, 0, width);
};
CanvasRenderingContext2D.prototype.fillJustifyText = fillJustifyText;
CanvasRenderingContext2D.prototype.strokeJustifyText = strokeJustifyText;
CanvasRenderingContext2D.prototype.measureJustifiedText = measureJustifiedText;



function wrapText(context, text, x, y, maxWidth, fontSize, fontFace) {
  var words = text.split(" ");
  var line = "";
  var lineHeight = fontSize;

  context.font = fontSize + "px " + fontFace;

  for (var n = 0; n < words.length; n++) {
    var testLine = line + words[n] + " ";
    var metrics = context.measureText(testLine);
    var testWidth = metrics.width;
    if (testWidth > maxWidth) {
      context.textAlign = "center";
      context.fillJustifyText(line, x, y, maxWidth, setting);
      line = words[n] + " ";
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  context.fillText(line, x, y);
  return y;
}
var textUnderline = function (
  context,
  text,
  x,
  y,
  color,
  textSize,
  align
) {
  //Get the width of the text
  var textWidth = context.measureText(text).width;

  //var to store the starting position of text (X-axis)
  var startX;

  //var to store the starting position of text (Y-axis)
  // I have tried to set the position of the underline according
  // to size of text. You can change as per your need
  var startY = y + parseInt(textSize) / 15;

  //var to store the end position of text (X-axis)
  var endX;

  //var to store the end position of text (Y-axis)
  //It should be the same as start position vertically.
  var endY = startY;

  //To set the size line which is to be drawn as underline.
  //Its set as per the size of the text. Feel free to change as per need.
  var underlineHeight = parseInt(textSize) / 15;

  //Because of the above calculation we might get the value less
  //than 1 and then the underline will not be rendered. this is to make sure
  //there is some value for line width.
  if (underlineHeight < 1) {
    underlineHeight = 1;
  }

  context.beginPath();
  if (align == "center") {
    startX = x - textWidth / 2;
    endX = x + textWidth / 2;
  } else if (align == "right") {
    startX = x - textWidth;
    endX = x;
  } else {
    startX = x;
    endX = x + textWidth;
  }

  context.strokeStyle = color;
  context.lineWidth = underlineHeight;
  context.moveTo(startX, startY);
  context.lineTo(endX, endY);
  context.stroke();
};
var Board = (function() {
   var boardObject = {
     resolution: 2,
     dom: null,
     ctx: null,
     domMem: null,
     ctxMem: null,
     bgColor: '#ffffff',
     pos: {
       x: 0,
       y: 0
     },
     loadToMemory: function loadToMemory(event) {
       var imageObj = event.target;
       this.domMem.width = imageObj.width;
       this.domMem.height = imageObj.height;
       this.ctxMem.drawImage(imageObj, 0, 0);
       this.ctx.drawImage(imageObj, 0, 0);
     },
     init: function init(canvasId) {
       this.dom = document.getElementById(canvasId);
       this.ctx = this.dom.getContext('2d', {desynchronized: true});

       // Additional Configuration
       this.ctx.imageSmoothingEnabled = true;

       // Create buffer
       this.domMem = document.createElement('canvas');
       this.ctxMem = this.domMem.getContext('2d');
       this.ctxMem.fillStyle = this.bgColor;
       this.ctxMem.fillRect(0,0, this.domMem.width, this.domMem.height);

       // Set up sizing
       fitToWindow.bind(this)();
       window.addEventListener('resize', fitToWindow.bind(this));

       // Load canvas from local storage
       if (localStorage.dataURL) {
         var img = new window.Image();
         img.addEventListener('load', this.loadToMemory.bind(this));
         img.setAttribute('src', localStorage.dataURL);
       }
     },
     getPointerPos: function getPointerPos(event) {
       return {
         x: (event.pageX - this.pos.x) * this.resolution,
         y: (event.pageY - this.pos.y) * this.resolution
       }
     },
     storeMemory: function storeMemory() {
       this.ctxMem.drawImage(this.dom, 0, 0);
       localStorage.setItem('dataURL', this.domMem.toDataURL());
     },
     clearMemory: function clearMemory() {
       localStorage.clear();
       this.ctx.fillStyle = this.bgColor;
       this.ctx.fillRect(0,0, this.dom.width, this.dom.height);
       this.ctx.fillStyle = "black"; 
       wrapText(
        this.ctx,
        "How much wood would a woodchuck <u>ch</u>uck if a woodchuck could chuck wood?How much wood would a woodchuck chuck if a woodchuck could chuHow much wood would a woodchuck How much wood would a woodchuck chuck if a woodchuck could chuck wood?How much wood would a woodchuck chuck if a woodchuck could chuck wood?chuck if a woodchuck could chuck wood?ck wood?",
        600,
        200,
        1000,
        40
      )
       this.domMem.width = this.dom.width;
       this.domMem.height = this.dom.height;
       this.ctxMem.fillStyle = this.bgColor;
       this.ctxMem.fillRect(0,0, this.dom.width, this.dom.height);
     }
   };

    var fitToWindow = function fitToWindow() {
      var marginX = 10;
      var marginY = 10;

      var heightCss = window.innerHeight - marginY;
      var heightCanvas = heightCss * this.resolution;
      var widthCss = window.innerWidth - marginX;
      var widthCanvas = widthCss * this.resolution;

      // If new size is larger than memory
      if (widthCanvas > this.domMem.width || heightCanvas > this.domMem.height) {
        // Create buffer
        var bufferCanvas = document.createElement('canvas');
        var bufferCtx = bufferCanvas.getContext('2d');

        bufferCanvas.width = this.domMem.width;
        bufferCanvas.height = this.domMem.height;

        // Clear buffer
        bufferCtx.fillStyle = this.bgColor;
        bufferCtx.fillRect(0, 0, widthCanvas, heightCanvas);

        // Save canvas to buffer
        bufferCtx.drawImage(this.dom, 0, 0);

        // Resize memory
        if (this.domMem.width < widthCanvas) this.domMem.width = widthCanvas;
        if (this.domMem.height < heightCanvas) this.domMem.height = heightCanvas;
        this.ctxMem.drawImage(bufferCanvas, 0, 0);
      } else {
        this.ctxMem.drawImage(this.dom, 0 ,0);
      }

      // resize current canvas
      this.dom.style.height = heightCss + 'px';
      this.dom.style.width = widthCss + 'px';
      this.dom.width = widthCanvas;
      this.dom.height = heightCanvas;
      this.ctx.fillStyle = this.bgColor;
      this.ctx.fillRect(0,0, this.dom.width, this.dom.height);
      this.ctx.drawImage(this.domMem, 0, 0);

      this.pos.x = this.dom.offsetLeft;
      this.pos.y = this.dom.offsetTop;
    }

   return boardObject;
})();
