(function(){
 const colors=window.SEORIPUL_SYMBOLS?.mark?.colors||[];
 const values=[['--org-primary',colors[0]?.hex||'#2A5CAA'],['--org-accent',colors[1]?.hex||'#F04E4C']];
 for(const [name,value] of values)if(/^#[0-9a-f]{6}$/i.test(value))document.documentElement.style.setProperty(name,value);
})();
