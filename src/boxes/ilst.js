/** @type {Record<string, string>} */
const itemNames = {
  "©ART": "Artist Metadata Item",
  "©alb": "Album Metadata Item",
  "©cmt": "Comment Metadata Item",
  "©day": "Release Date Metadata Item",
  "©gen": "Genre Metadata Item",
  "©grp": "Grouping Metadata Item",
  "©nam": "Title Metadata Item",
  "©too": "Encoder Metadata Item",
  aART: "Album Artist Metadata Item",
  covr: "Cover Art Metadata Item",
  cpil: "Compilation Metadata Item",
  desc: "Description Metadata Item",
  disk: "Disc Number Metadata Item",
  gnre: "Genre Metadata Item",
  pgap: "Gapless Playback Metadata Item",
  tmpo: "Tempo Metadata Item",
  trkn: "Track Number Metadata Item",
};

/** @type {import("./types.js").BoxDefinition<never>} */
export default {
  name: "Item List Box",
  description: "Contains metadata items, commonly used for iTunes-style tags.",
  container: true,

  getChildDefinition(type) {
    return {
      name: itemNames[type] ?? "iTunes Metadata Item",
      description: "Apple metadata item entry inside the item list.",
      container: true,
    };
  },
};
