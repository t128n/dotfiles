vim.cmd("let g:netrw_banner = 0")

vim.opt.guicursor = ""
vim.opt.nu = true
vim.opt.relativenumber = true

vim.opt.tabstop = 4
vim.opt.softtabstop = 4
vim.opt.shiftwidth = 4
vim.opt.expandtab = true
vim.opt.autoindent = true
vim.opt.smartindent = true
vim.opt.wrap = false

vim.opt.swapfile = false
vim.opt.backup = false
vim.opt.undofile = true

vim.opt.incsearch = true
vim.opt.inccommand = "split"
vim.opt.ignorecase = true
vim.opt.smartcase = true

vim.opt.termguicolors = true
vim.opt.background = "dark"
vim.opt.scrolloff = 8
vim.opt.signcolumn ="yes"

vim.opt.backspace = {"start", "eol", "indent"}

vim.opt.splitright = true
vim.opt.splitbelow = true

vim.opt.isfname:append("@-@") 
vim.opt.updatetime = 50
vim.opt.colorcolumn = "80"

vim.opt.clipboard:append("unnamedplus")
vim.opt.hlsearch = true

vim.opt.mouse = "a"
vim.g.editorconfig = true

vim.opt.list = true
vim.opt.listchars = {
    tab = '▸ ',       -- Show tabs as a right-pointing triangle and a space
    trail = '•',      -- Show trailing spaces as a middle dot
    nbsp = '␣',       -- Highlight non-breaking spaces as a hollow box (U+2423)
    extends = '»',    -- Indicator for text extending beyond the screen
    precedes = '«',   -- Indicator for text preceding the screen
    eol = '⏎'         -- Show end-of-line (CRLF) as a return symbol
}
