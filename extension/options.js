
function load() {
  //var selectedElement = document.getElementById('selected');
  //var sel = window.getSelection();
  //sel.removeAllRanges();
  //var range = document.createRange();
  //range.selectNode(selectedElement);
  //sel.addRange(range);

  var rateElement = document.getElementById('rate');
  var pitchElement = document.getElementById('pitch');
  var volumeElement = document.getElementById('volume');
  var rate = localStorage['rate'] || 1.0;
  var pitch = localStorage['pitch'] || 1.0;
  var volume = localStorage['volume'] || 1.0;
  rateElement.value = rate;
  pitchElement.value = pitch;
  volumeElement.value = volume;
  function listener(evt) {
    rate = rateElement.value;
    localStorage['rate'] = rate;
    pitch = pitchElement.value;
    localStorage['pitch'] = pitch;
    volume = volumeElement.value;
    localStorage['volume'] = volume;
  }
  rateElement.addEventListener('keyup', listener, false);
  pitchElement.addEventListener('keyup', listener, false);
  volumeElement.addEventListener('keyup', listener, false);
  rateElement.addEventListener('mouseup', listener, false);
  pitchElement.addEventListener('mouseup', listener, false);
  volumeElement.addEventListener('mouseup', listener, false);

  var defaultsButton = document.getElementById('defaults');
  defaultsButton.addEventListener('click', function(evt) {
    rate = 1.0;
    pitch = 1.0;
    volume = 1.0;
    localStorage['rate'] = rate;
    localStorage['pitch'] = pitch;
    localStorage['volume'] = volume;
    rateElement.value = rate;
    pitchElement.value = pitch;
    volumeElement.value = volume;
  }, false);

  var testButton = document.getElementById('test');
  testButton.addEventListener('click', function(evt) {
    chrome.tts.speak(
        'Testing speech synthesis',
        {voiceName: localStorage['voice'],
         rate: parseFloat(rate),
         pitch: parseFloat(pitch),
         volume: parseFloat(volume)});
  });
}

document.addEventListener('DOMContentLoaded', load);
