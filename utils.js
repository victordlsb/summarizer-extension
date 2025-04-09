function hashCode(str) {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
      const chr = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32-bit integer
    }
    return hash;
  };

function generateSummaryContainerId(anchorText)
  { return 'div-' + hashCode(anchorText);}

window.hashCode = hashCode;
window.generateSummaryContainerId = generateSummaryContainerId;