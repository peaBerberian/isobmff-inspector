# isobmff-inspector ############################################################

The ISOBMFF-inspector is a simple module compatible with Node.js and JavaScript
to facilitate ISOBMFF file parsing.

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
    ],
    errors: [ // only set when the inspector detected parsing issues
      {
        recoverable: false,
        message: "Truncated box: declared 24 byte(s), only 20 available."
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

When possible, the inspector keeps parsing after an error to return as much
information as it can. Parsing issues are reported on the corresponding box
through an optional ``errors`` array instead of being logged to the console.

Each error entry has:

- ``recoverable``: whether the inspector could recover from this issue while
  parsing the box
- ``message``: a human-readable description of the issue

``recoverable: false`` means the inspector could not reliably parse part of the
file, for example because a box is truncated, has an invalid size, or a field
could not be read. ``recoverable: true`` means parsing could continue, but the
parsed result may be incomplete or suspicious, for example when a known box
parser left unread bytes.

## Integer types ###############################################################

Parsed integer values follow a fixed rule:

- 8-bit to 32-bit integers are returned as JavaScript ``number`` values
- 64-bit integers are returned as JavaScript ``bigint`` values

This means 64-bit ISOBMFF fields are always exact and never depend on the
parsed value's magnitude.

## Parsed boxes ################################################################

The inspector only parses the following ISOBMFF boxes for now:
  - avc1
  - avc3
  - avcC
  - btrt
  - co64
  - colr
  - ctts
  - dinf
  - dref
  - edts
  - elst
  - encv
  - esds
  - free
  - frma
  - ftyp
  - hdlr
  - hev1
  - hvc1
  - hvcC
  - ID32
  - ilst
  - iods
  - leva
  - mdat
  - mdhd
  - mdia
  - mehd
  - meta
  - mfhd
  - minf
  - moof
  - moov
  - mp4a
  - mvex
  - mvhd
  - pasp
  - pdin
  - pssh
  - saio
  - saiz
  - schi
  - schm
  - sdtp
  - sidx
  - sinf
  - skip
  - smhd
  - stbl
  - stco
  - stsc
  - stsd
  - stss
  - stsz
  - stts
  - styp
  - tenc
  - tfdt
  - tfhd
  - tkhd
  - traf
  - trak
  - trep
  - trex
  - trun
  - udta
  - url 
  - urn 
  - uuid
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
