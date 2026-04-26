/**
 * @typedef {Object} FileTypeBoxContent
 * @property {string|number} major_brand
 * @property {number} minor_version
 * @property {Array<string|number>} compatible_brands
 */

/** @type {import("./types.js").BoxDefinition<FileTypeBoxContent>} */
export default {
  name: "File Type Box",
  description: "File type and compatibility",
  parser(reader) {
    const len = reader.getTotalLength();
    reader.fieldFourCc("major_brand", { description: "Brand identifier" });
    reader.fieldUint("minor_version", 4, {
      description:
        "Informative integer for the minor version of the major brand",
    });
    const compatArr = [];
    const compatibleBrandsOffset = reader.getCurrentOffset();
    for (let i = 8; i < len; i += 4) {
      compatArr.push(reader.readFourCc());
    }
    reader.addField("compatible_brands", compatArr, {
      description: "List of brands",
      offset: compatibleBrandsOffset,
      byteLength: reader.getCurrentOffset() - compatibleBrandsOffset,
    });
  },
};
