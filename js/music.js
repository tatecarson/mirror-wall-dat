async function getData(url) {
  return new Promise((resolve) => {
    const request = new XMLHttpRequest();

    request.open('GET', url, true);

    request.responseType = 'arraybuffer';

    request.onload = function () {
      const audioData = request.response;

      resolve(audioData);
    }

    request.send();
  });
}

async function init() {
  const audioContext = p5.prototype.getAudioContext();

  const granular = new Granular({
    audioContext,
    envelope: {
      attack: 0,
      decay: 0.5
    },
    density: 0.01,
    spread: 0.1,
    pitch: 1
  });


  const delay = new p5.Delay();


  delay.process(granular, 0.5, 0.5, 3000); // source, delayTime, feedback, filter frequency

  // const reverb = new p5.Reverb();

  // // due to a bug setting parameters will throw error
  // // https://github.com/processing/p5.js/issues/3090
  // reverb.process(delay, 3, 2); // source, reverbTime, decayRate in %, reverse

  // reverb.amp(1);

  const compressor = new p5.Compressor();

  compressor.process(delay, 0.005, 6, 10, -24, 0.05); // [attack], [knee], [ratio], [threshold], [release]

  granular.on('settingBuffer', () => console.log('setting buffer'));
  granular.on('bufferSet', () => console.log('buffer set'));

  const data = await getData('./js/granular/talking.wav');

  await granular.setBuffer(data);

  const resume = document.getElementById('resume');

  let id; // global so you can stop in other listener 
  resume.addEventListener('click', () => {
    CABLES.patch.setVarValue('playCables', 1)

    id = granular.startVoice({
      position: 0.1,
      density: 0.01,
      gain: 0.5
    });

    // Change from cables
    CABLES.patch.config.triggerDensity = function (parameters) {
      let rand = Math.random()

      granular.set({
        density: map(rand, 0, 1, 0.1, 1)
      })

      granular.updateVoice(id, {
        position: rand
      });

      delay.feedback(rand)
    }; 
  })

  const stop = document.getElementById('stop');
  stop.addEventListener('click', () => {
    CABLES.patch.setVarValue('playCables', 0)
    granular.stopVoice(id);
  })

  function map(value, inMin, inMax, outMin, outMax) {
    return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
  }
}
