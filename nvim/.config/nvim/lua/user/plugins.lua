local status_ok, packer = pcall(require, "packer")
if not status_ok then
  vim.notify("Could not load packer.nvim. Check your installation.")
  return
end

return packer.startup(function(use)
    use 'wbthomason/packer.nvim'
end)

