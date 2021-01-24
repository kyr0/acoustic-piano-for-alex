import './App.css';
import WebMidi from 'webmidi';
import { useCallback, useRef, useState } from 'react';
import MIDISounds from 'midi-sounds-react';
import { Midi } from '@tonejs/midi';
import { Score } from './Score'
import { useEffectOnce } from 'react-use';

function App() {

  const [compositionFile] = useState("compositions/liz_et4.mid");
  // see catalog: https://surikov.github.io/webaudiofont/#catalog-of-instruments
  const [instrument] = useState(3);
  const [displayComposition, setDisplayComposition]= useState([['a4']]);
  const [composition, setComposition] = useState();
  const midiSounds = useRef();

  const loadMidiFile = useCallback(() => () => {

    (async() => {

      // load a midi file
      const compositionMidi = await Midi.fromUrl(compositionFile)
      setComposition(compositionMidi);
    })();
  }, [compositionFile]);


  const enableMidiInput = useCallback(() => {

    WebMidi.enable((err) => {
      if (err) {
          console.error(err);
          console.error('[DirectMidiInput] Disabled due to an error');
          return;
      }

      // also listen to newly connected devices
      WebMidi.addListener('connected', (evt) => {

        if (evt.port.type === 'input') {
            const newInput = WebMidi.getInputById(evt.port.id);
            console.log('[DirectMidiInput] New device connected: ', evt.port.name, 'Starting to listen...');

            if (newInput) {

              console.log('[DirectMidiInput] Listen to input...', newInput.name);
              
              // key down
              evt.port.addListener('noteon', 'all', (evt) => {
                console.log('[DirectMidiInput] noteOn', evt);

                midiSounds.current.playChordNow(instrument, [evt.note.number], 2.5)

                // render one (currently played) note
                setDisplayComposition([[`${evt.note.name.toLowerCase()}${evt.note.octave}`]]);
              });

              // key up
              evt.port.addListener('noteoff', 'all', (evt) => {
                console.log('[DirectMidiInput] noteOff', evt);
                // not impl. yet
              });
            }
        }

      },  [midiSounds.current, instrument]);

      console.log('[DirectMidiInput] Enabled');
      console.log('[DirectMidiInput] Inputs', WebMidi.inputs);
      console.log('[DirectMidiInput] Outputs', WebMidi.outputs);
    });

  }, [instrument, midiSounds.current]);

  useEffectOnce(() => {
    enableMidiInput();
  })

  const playMidiFile = useCallback(() => () => {

    console.log('Play composition', composition, midiSounds.current.output);

    if (!midiSounds.current) return;

    midiSounds.current.setMasterVolume(0.5)

    midiSounds.current.midNoteOn()
  
    //get the tracks
    composition.tracks.forEach(track => {
      //notes are an array
      const notes = track.notes;
      notes.forEach(note => {
        //note.midi, note.time, note.duration, note.name
        //console.log('track', track, 'note', note.time, note.midi);

        // plays a note or chord at a specific time relatively
        midiSounds.current.playChordAt(
          note.time * 2 /* MIDI relative time times 2 (half speed) */, 
          instrument, 
          [note.midi], 
          2.5 /* duration in sec */
        );
      })
    })
  }, [instrument, composition, midiSounds.current])

  return (
    <div className="App">
      <header className="App-header">

        <h2>Acoustic Piano for Alex</h2>

        Connect your Piano and play any note - <br />
        or load the composition (MIDI) and click on "Play" <br />
        (takes a while!).

        <br /><br />

        <button onClick={loadMidiFile()}>Load composition</button>

        {composition && <h3>{composition.name}</h3>}

        <button disabled={!composition} onClick={playMidiFile()}>Play</button>
        <br />

        Click here to set volume and EQ:

        {/** @see https://github.com/surikov/midi-sounds-react/blob/master/src/midisoundsreact.js */}
		    <MIDISounds ref={midiSounds} appElementName="root" instruments={[instrument]} />	

        Play a note on the Piano to update VexFlow interactively:

        <Score
          clef='treble'
          timeSignature='4/4'
          width={450}
          height={150}
          staves={displayComposition}
        />
      </header>
    </div>
  );
}

export default App;