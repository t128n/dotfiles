local opts = { noremap = true, silent = true }

vim.g.mapleader = " "
vim.g.maplocalleader = " "

vim.keymap.set("v", "J", ":m '>+1<CR>gv=gv", { desc = "moves lines down in visual selection" })
vim.keymap.set("v", "K", ":m '<-2<CR>gv=gv", { desc = "moves lines up in visual selection" })

vim.keymap.set("n", "J", "mzJ`z", { desc = "joins line below with current line" })

vim.keymap.set("n", "<C-d>", "<C-d>zz", { desc = "move down in buffer with cursor centered" })
vim.keymap.set("n", "<C-u", "<C-u>zz", { desc = "move up in buffer with cursor centered" })

vim.keymap.set("n", "n", "nzzzv", { desc = "previous result in search" })
vim.keymap.set("n", "N", "Nzzzv", { desc = "next result in search" })

vim.keymap.set("v", "<", "<gv", opts) -- Indent in visual mode without reselecting
vim.keymap.set("v", ">", ">gv", opts) -- Indent in visual mode without reselecting

vim.keymap.set("x", "<leader>p", [["_dP]]) -- Paste without replacing clipboard contents
vim.keymap.set("v", "p", '"_dp', opts)

vim.keymap.set({ "n", "v" }, "<leader>d", [["_d]]) -- Deleting without replacing clipboard

vim.keymap.set("i", "<C-c>", "<Esc>")
vim.keymap.set("n", "<C-c>", ":nohl<CR>", { desc = "Clear sarch highlight", silent = true })

vim.keymap.set("n", "<leader>f", vim.lsp.buf.format) -- formatting

vim.keymap.set("n", "Q", "<nop>") -- Prevent entering cmd mode
vim.keymap.set("n", "x", '"_x', opts) -- prevent deleted char to be copied to clipboard

vim.keymap.set("n", "<leader>x", "<cmd>!chmod +x %<CR>", { silent = true, desc = "make file executable" })

vim.api.nvim_create_autocmd("TextYankPost", {
    desc = "Highlight when yanking text",
    group = vim.api.nvim_create_augroup("kickstart-highlight-yank", { clear = true }),
    callback = function()
        vim.highlight.on_yank()
    end,
})

vim.keymap.set("n", "<leader>tn", "<cmd>tabnew<CR>") -- Open a new tab
vim.keymap.set("n", "<leader>tx", "<cmd>tabclose<CR>") -- Close curr tab
vim.keymap.set("n", "<leader>tl", "<cmd>tabn<CR>") -- next tab
vim.keymap.set("n", "<leader>th", "<cmd>tabp<CR>") -- prev tab
vim.keymap.set("n", "<leader>tj", "<cmd>tabnew %<CR>") -- clone tab
vim.keymap.set("n", "<leader>sv", "<C-w>v", { desc = "split window vertically" })
vim.keymap.set("n", "<leader>sh", "<C-w>s", { desc = "split window horizontally" })
vim.keymap.set("n", "<leader>se", "<C-w>=", { desc = "make splits equal size" })
vim.keymap.set("n", "<leader>sx", "<cmd>close<CR>", { desc = "close curr split" })

-- copy filepath to clipboard
vim.keymap.set("n", "<leader>fp", function()
    local filePath = vim.fn.expand("%:~") -- gets file path relative to home dir
    vim.fn.setreg("+", filePath) -- copy fp to clip. reg.
    print("File path copied to clipboard: " .. filePath)
end, { desc = "copy filepath to clipboard" })
