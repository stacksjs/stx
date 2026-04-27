/**
 * x-tooltip Directive Runtime
 *
 * Provides a lightweight tooltip directive for the signals runtime.
 * Uses event delegation with a single shared tooltip element.
 *
 * Usage:
 *   <button x-tooltip="Save changes">Save</button>
 *   <button x-tooltip="Delete item" x-tooltip-position="bottom">Delete</button>
 *   <span x-tooltip="Copy to clipboard" x-tooltip-position="left">Copy</span>
 *   <span x-tooltip="More info" x-tooltip-position="right">Info</span>
 *
 * Positions: top (default), bottom, left, right
 * Override with x-tooltip-position attribute.
 *
 * @module builtins/tooltip
 */

export function getTooltipRuntime(): string {
  return `
(function(){
var tip=null,hideTimer=null,currentEl=null;

function createTip(){
  tip=document.createElement("div");
  tip.id="stx-tooltip";
  tip.style.cssText="position:absolute;background:#1f2937;color:#fff;font-size:12px;line-height:1.4;padding:6px 10px;border-radius:6px;max-width:250px;z-index:999999;pointer-events:none;opacity:0;transition:opacity .15s ease;white-space:pre-wrap;word-wrap:break-word;box-shadow:0 2px 8px rgba(0,0,0,.25)";
  var arrow=document.createElement("div");
  arrow.className="stx-tip-arrow";
  arrow.style.cssText="position:absolute;width:0;height:0;border:5px solid transparent";
  tip.appendChild(arrow);
  var text=document.createElement("span");
  text.className="stx-tip-text";
  tip.appendChild(text);
  document.body.appendChild(tip);
}

function position(el){
  var pos=el.getAttribute("x-tooltip-position")||"top";
  var r=el.getBoundingClientRect();
  var sy=window.scrollY,sx=window.scrollX;
  tip.style.display="block";
  tip.style.opacity="0";
  // Force layout so we can measure
  var tw=tip.offsetWidth,th=tip.offsetHeight;
  var arrow=tip.querySelector(".stx-tip-arrow");
  var left,top;

  if(pos==="top"){
    left=r.left+r.width/2-tw/2+sx;
    top=r.top-th-8+sy;
    if(top-sy<0){pos="bottom";}
  }
  if(pos==="bottom"){
    left=r.left+r.width/2-tw/2+sx;
    top=r.bottom+8+sy;
    arrow.style.cssText="position:absolute;width:0;height:0;border:5px solid transparent;border-bottom-color:#1f2937;top:-10px;left:50%;transform:translateX(-50%)";
  }
  if(pos==="left"){
    left=r.left-tw-8+sx;
    top=r.top+r.height/2-th/2+sy;
    if(left-sx<0){pos="right";}
  }
  if(pos==="right"){
    left=r.right+8+sx;
    top=r.top+r.height/2-th/2+sy;
    arrow.style.cssText="position:absolute;width:0;height:0;border:5px solid transparent;border-right-color:#1f2937;left:-10px;top:50%;transform:translateY(-50%)";
  }

  // Set arrow for top/left after potential flips
  if(pos==="top"){
    arrow.style.cssText="position:absolute;width:0;height:0;border:5px solid transparent;border-top-color:#1f2937;bottom:-10px;left:50%;transform:translateX(-50%)";
  }
  if(pos==="left"){
    arrow.style.cssText="position:absolute;width:0;height:0;border:5px solid transparent;border-left-color:#1f2937;right:-10px;top:50%;transform:translateY(-50%)";
  }

  // Clamp horizontal
  if(left<sx+4) left=sx+4;
  if(left+tw>sx+window.innerWidth-4) left=sx+window.innerWidth-tw-4;

  tip.style.left=left+"px";
  tip.style.top=top+"px";
  tip.style.opacity="1";
}

function showTip(el){
  if(hideTimer){clearTimeout(hideTimer);hideTimer=null;}
  if(!tip) createTip();
  var text=el.getAttribute("x-tooltip");
  if(!text) return;
  tip.querySelector(".stx-tip-text").textContent=text;
  currentEl=el;
  position(el);
}

function hideTip(){
  if(!tip) return;
  tip.style.opacity="0";
  hideTimer=setTimeout(function(){
    if(tip) tip.style.display="none";
    currentEl=null;
  },150);
}

document.addEventListener("mouseover",function(e){
  var el=e.target.closest("[x-tooltip]");
  if(el) showTip(el);
});
document.addEventListener("mouseout",function(e){
  var el=e.target.closest("[x-tooltip]");
  if(el&&el===currentEl) hideTip();
});
document.addEventListener("focusin",function(e){
  var el=e.target.closest("[x-tooltip]");
  if(el) showTip(el);
});
document.addEventListener("focusout",function(e){
  var el=e.target.closest("[x-tooltip]");
  if(el) hideTip();
});
})();
`
}
