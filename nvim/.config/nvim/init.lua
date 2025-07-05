-- Better Search
vim.o.ignorecase = true
vim.o.smartcase = true

-- mouse support + persistent undo
vim.o.mouse = 'a'
vim.o.undofile = true
vim.o.undodir = vim.fn.stdpath('state') .. '/undo'

-- UI bits
vim.o.signcolumn  = 'yes'     -- avoid text shifting when gitsigns etc appear
vim.o.colorcolumn = '120'      -- guide at 80 chars
vim.o.completeopt = 'menuone,noselect'  -- better completion menu

vim.api.nvim_create_autocmd('TextYankPost', {
  callback = function()
    vim.highlight.on_yank { timeout = 200 }
  end,
})

-- Basic Editor Settings
vim.o.number = true 		-- Show line numbers
vim.o.relativenumber = true	-- Show relative line numbers
vim.o.tabstop = 4		-- Tab size
vim.o.shiftwidth = 4		-- Size per indent
vim.o.expandtab = true		-- Use spaces for tab
vim.o.smartindent = true	-- Smart auto-indent
vim.o.wrap = false		-- Disable line wrapping
vim.o.cursorline = true		-- Highlight current line
vim.o.termguicolors = true	-- Enable true color support

-- Syntax Highlighting
vim.cmd('syntax enable')
vim.cmd('filetype plugin indent on')

-- Set leader key
vim.g.mapleader = ' '

-- Use System Keyboard
vim.o.clipboard = "unnamedplus"

