local fn = vim.fn
local install_path = fn.stdpath('data')..'/site/pack/packer/start/packer.nvim'

-- Check if packer.nvim is installed
if fn.empty(fn.glob(install_path)) > 0 then
  vim.notify("Installing packer.nvim, please wait...")
  -- Clone the repository
  fn.system({'git', 'clone', '--depth', '1', 'https://github.com/wbthomason/packer.nvim', install_path})
  -- Add packer to the runtime path for the current session
  vim.cmd [[packadd packer.nvim]]
  vim.notify("Packer installed successfully. Please run :PackerSync")
end

