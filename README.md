# isobmff-inspector ############################################################

The ISOBMFF-inspector is a simple module compatible with Node.js and JavaScript
to facilitates ISOBMFF file parsing.

This is most of all useful for debugging purposes.

You can see it working online through the demo page of the [AISOBMFFWVDFBUTFAII
](https://github.com/peaBerberian/AISOBMFFWVDFBUTFAII), available [here
](https://peaberberian.github.io/AISOBMFFWVDFBUTFAII/). AISOBMFFWVDFBUTFAII is
an online ISOBMFF visualizer based on this parser.


## Usage #######################################################################

You can install it through npm:
```sh
npm install isobmff-inspector
```

Then you can then directly use the inspector in your JavaScript or Node file:
```js
import inspectISOBMFF from "isobmff-inspector";

// The given file can be of either of those types:
//   - ArrayBuffer
//   - Any TypedArray (Uint8Array, Uint16Array, etc.)
const parsed = inspectISOBMFF(MY_ISOBMFF_FILE);
console.log(parsed);
```

In the previous example, ``parsed`` will have something like the following
structure:
```js
[ // boxes, in the order they are encountered
  {
    alias: "styp", // "short" name of the box
    name: "Segment Type Box", // more human-readable name for the box
    size: 24, // size, in bytes
    values: [ // values in the box, in the order they are encountered
      {
        name: "major-brand", // name of the value
        value: "iso6" // ...value. Displayable one are JS strings
      },
      {
        name: "minor_version",
        value: 0 // Number values are usually JS Numbers
      },
      {
        name: "compatible_brands",
        value: "iso6, msdh", // here brands are separated by a comma
      }
    ]
  },
  {
    alias: "moof",
    name: "Movie Fragment Box",
    size: 788,
    children: [ // children boxes, in the order they are encountered
      {
        alias: "mfhd",
        name: "Movie Fragment Header Box",
        values: [
          {
            name: "version",
            value: 0
          }
          {
            name: "flags",
            value: 0
          },
          {
            name: "sequence_number",
            value: 2
          }
        ]
      }
    ]
  }
  // ...
]
```

Note: You can also add to your page or your console the script defined in
``dist/bundle.js``.
You will then have an ``inspectISOBMFF`` function defined which has the same API
as above.

## Parsed boxes ################################################################

The inspector only parses the following ISOBMFF boxes for now:
  - dinf
  - dref
  - edts
  - free
  - ftyp
  - hdlr
  - mdat
  - mdhd
  - mdia
  - mehd
  - mfhd
  - minf
  - moof
  - moov
  - mvex
  - mvhd
  - pdin
  - pssh
  - sdtp
  - sidx
  - skip
  - styp
  - tfdt
  - tfhd
  - tkhd
  - traf
  - trak
  - trex
  - trun
  - url
  - urn
  - vmhd

I plan to support each one of them but UUIDs (I may add support for some of them
in the future, for example for Smooth Streaming ones).


## Contribute ##################################################################

You can help me to add parsing logic for other boxes by updating the
``src/boxes`` directory.

You can base yourself on already-defined boxes. Each of the ``parser`` functions
there receive a ``bufferReader`` object.

This object is obtained by giving the box's content as an ``Uint8Array`` to the
``createBufferReader`` function defined and documented in
``src/utils/buffer_reader.js``.
