local options = vim.o

-- Better Search
options.ignorecase = true
options.smartcase = true

-- mouse support + persistent undo
options.mouse = 'a'
options.undofile = true
options.undodir = vim.fn.stdpath('state') .. '/undo'

-- UI bits
options.signcolumn  = 'yes'     -- avoid text shifting when gitsigns etc appear
options.colorcolumn = '120'      -- guide at 80 chars
options.completeopt = 'menuone,noselect'  -- better completion menu

vim.api.nvim_create_autocmd('TextYankPost', {
  callback = function()
    vim.highlight.on_yank { timeout = 200 }
  end,
})

-- Basic Editor Settings
options.number = true 		-- Show line numbers
options.relativenumber = true	-- Show relative line numbers
options.tabstop = 4		-- Tab size
options.shiftwidth = 4		-- Size per indent
options.expandtab = true		-- Use spaces for tab
options.smartindent = true	-- Smart auto-indent
options.wrap = false		-- Disable line wrapping
options.cursorline = true		-- Highlight current line
options.termguicolors = true	-- Enable true color support

-- Syntax Highlighting
vim.cmd('syntax enable')
vim.cmd('filetype plugin indent on')

-- Set leader key
vim.g.mapleader = ' '

-- Use System Keyboard
options.clipboard = "unnamedplus"

