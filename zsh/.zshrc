autoload -U colors && colors
setopt prompt_subst

PROMPT='%F{123}%n@%m %F{189}%~ %F{224}# %F{231}'

# Aliases
alias _ls='/bin/ls'
alias ls="eza --icons --group-directories-first --color=always"
alias ll="eza --icons --group-directories-first --long --color=always"

alias _find='/usr/bin/find'
alias find="fzf --preview 'bat --color=always --style=numbers --line-range :500 {}'"

alias _cat='/bin/cat'
alias cat="bat --color=always --style=full --line-range :500"