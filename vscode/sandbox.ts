// TypeScript/JavaScript sample code to test editor rendering

function printNestedStructures(): void {
  /**
   * Prints various nested structures to test editor rendering:
   * - Nested objects and arrays
   * - Indented code blocks
   * - Long lines
   * - Special characters
   *
   * This function doesn't 'do' anything functional, it's purely for display.
   */

  // Nested objects and arrays
  const data = {
    user: {
      id: 12345,
      name: "Torben",
      email: "torben@example.com",
      settings: {
        theme: "dark",
        notifications: [
          { type: "email", enabled: true },
          { type: "sms", enabled: false, number: "123-456-7890" },
        ],
      },
    },
    projects: [
      {
        name: "Project Alpha",
        status: "active",
        tasks: [
          "Implement feature X",
          "Fix bug Y",
          "Write documentation for Z",
        ],
      },
      { name: "Project Beta", status: "pending" },
    ],
    emptyList: [],
    emptyObject: {},
  };

  console.log("--- Nested Data Structure ---");
  console.log(data);
  console.log("\n");

  // Indented code blocks
  console.log("--- Indented Code Block ---");

  function exampleFunction(param1: number, param2: number): void {
    if (param1 > 0 && param2 < 100) {
      for (let i = 0; i < 5; i++) {
        const result = param1 * i + param2;
        console.log(`Iteration ${i}: ${result}`);
      }
    } else {
      console.log("Conditions not met.");
    }
    // A very long line to test wrapping and horizontal scrolling,
    // and maybe some reallyreallyreallylongwordthatmightcauseproblems
    // and some unicode characters like こんにちは or ¡Olé!
  }
  exampleFunction(5, 50);
  console.log("\n");

  // Long lines
  console.log("--- Long Line Test ---");
  const longLine =
    "This is a very very very very very very very very very very very very " +
    "very very very very very very very very very very very very very very " +
    "very very very very very very very very very very very very very very " +
    "very very very very very very very very very very very very very very " +
    "very very very very very very very very very very very very very very " +
    "very very very very very very very very very very very very very very " +
    "very very very very very very very very very very very very very very " +
    "very very very very very very very very very very very very very very " +
    "long line that should test your editor's word wrapping and horizontal " +
    "scrolling capabilities, especially when it contains no spaces like " +
    "thisismyveryveryverylongwordwithoutanyspacesanditsgettinglongerandlonger.";
  console.log(longLine);
  console.log("\n");

  // Special characters
  console.log("--- Special Characters ---");
  console.log("Emojis: 🤔💡✨🚀🥳");
  console.log("Math: \\( \\alpha + \\beta = \\gamma \\) and $$ \\int_a^b f(x) dx = F(b) - F(a) $$");
  console.log("Currency: \\u0024 \\u20AC \\u00A3 \\u00A5");
  console.log("Unicode: 你好世界, 안녕하세요, Привет мир");
  console.log("Escaped: \\ \\' \\\" \\t \\n");
  console.log("`Backticks` and ~tildes~");
  console.log("\n");

  console.log("--- End of Test Output ---");
}

// Call the function to execute the test output
printNestedStructures();