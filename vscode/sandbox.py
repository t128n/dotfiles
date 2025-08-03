def print_nested_structures():
  """
  Prints various nested structures to test editor rendering:
  - Nested lists and dictionaries
  - Indented code blocks
  - Long lines
  - Special characters

  This function doesn't 'do' anything functional, it's purely for display.
  """

  # Nested lists and dictionaries
  data = {
      "user": {
          "id": 12345,
          "name": "Torben",
          "email": "torben@example.com",
          "settings": {
              "theme": "dark",
              "notifications": [
                  {"type": "email", "enabled": True},
                  {"type": "sms", "enabled": False, "number": "123-456-7890"},
              ],
          },
      },
      "projects": [
          {
              "name": "Project Alpha",
              "status": "active",
              "tasks": [
                  "Implement feature X",
                  "Fix bug Y",
                  "Write documentation for Z",
              ],
          },
          {"name": "Project Beta", "status": "pending"},
      ],
      "empty_list": [],
      "empty_dict": {},
  }

  print("--- Nested Data Structure ---")
  print(data)
  print("\n")

  # Indented code blocks
  print("--- Indented Code Block ---")

  def example_function(param1, param2):
    if param1 > 0 and param2 < 100:
      for i in range(5):
        result = param1 * i + param2
        print(f"Iteration {i}: {result}")
    else:
      print("Conditions not met.")
    # A very long line to test wrapping and horizontal scrolling,
    # and maybe some reallyreallyreallylongwordthatmightcauseproblems
    # and some unicode characters like こんにちは or ¡Olé!
  example_function(5, 50)
  print("\n")

  # Long lines
  print("--- Long Line Test ---")
  long_line = (
      "This is a very very very very very very very very very very very very "
      "very very very very very very very very very very very very very very "
      "very very very very very very very very very very very very very very "
      "very very very very very very very very very very very very very very "
      "very very very very very very very very very very very very very very "
      "very very very very very very very very very very very very very very "
      "very very very very very very very very very very very very very very "
      "very very very very very very very very very very very very very very "
      "very very very very very very very very very very very very very very "
      "long line that should test your editor's word wrapping and horizontal "
      "scrolling capabilities, especially when it contains no spaces like "
      "thisismyveryveryverylongwordwithoutanyspacesanditsgettinglongerandlonger."
  )
  print(long_line)
  print("\n")

  # Special characters
  print("--- Special Characters ---")
  print("Emojis: 🤔💡✨🚀🥳")
  print("Math: \( \alpha + \beta = \gamma \) and $$ \int_a^b f(x) dx = F(b) - F(a) $$")
  print("Currency: \u0024 \u20AC \u00A3 \u00A5")
  print("Unicode: 你好世界, 안녕하세요, Привет мир")
  print("Escaped: \\ \\' \\\" \\t \\n")
  print("`Backticks` and ~tildes~")
  print("\n")

  print("--- End of Test Output ---")


if __name__ == "__main__":
  print_nested_structures()