module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow hardcoded values in code',
      category: "Security",
      recommended: true,
    },
  },

  create: function (context) {
    return {
      Literal: function (node) {
        let valueRegEx = /^([a-zA-Z0-9_-]){10,25}$/
        if (typeof node.value === 'string' && valueRegEx.test(node.value)) {
          context.report({
            node,
            message: `we found hardcoded Token Value: "${node.value}"`,
          });
        }
      },
    };
  },
};
