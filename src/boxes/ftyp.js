/**
 * @typedef {Object} FileTypeBoxContent
 * @property {string} major_brand
 * @property {number} minor_version
 * @property {string} compatible_brands
 */

/** @type {import("../types.js").BoxDefinition<FileTypeBoxContent>} */
export default {
  name: "File Type Box",
  description: "File type and compatibility",
  parser(reader) {
    const len = reader.getTotalLength();
    reader.fieldAscii("major_brand", 4, { description: "Brand identifier" });
    reader.fieldUint("minor_version", 4, {
      description:
        "Informative integer for the minor version of the major brand",
    });
    const compatArr = [];
    for (let i = 8; i < len; i += 4) {
      compatArr.push(reader.bytesToASCII(4));
    }
    reader.addField("compatible_brands", compatArr.join(", "), {
      description: "List of brands",
    });
  },
};
