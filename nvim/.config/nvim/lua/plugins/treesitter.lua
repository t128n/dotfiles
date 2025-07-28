return {
  "nvim-treesitter/nvim-treesitter",
  build = ":TSUpdate",
  config = function()
    require("nvim-treesitter.configs").setup({
      ensure_installed = {
        "javascript",
        "typescript",
        "markdown",
        "bash",
        "python",
        "astro",
      },
      highlight = {
        enable = true, -- Enable highlighting for all installed languages
      },
      indent = {
        enable = true,
      },
    })
  end,
}
