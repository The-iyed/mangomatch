// Mock quiz data for testing the quiz interface without API calls

export type MockAnswer = {
  id: string
  text: string
  isCorrect: boolean
}

export type MockQuestion = {
  id: string
  text: string
  explanation: string
  answers: MockAnswer[]
}

export type MockQuiz = {
  id: string
  title: string
  description: string
  category: string
  difficulty: "easy" | "medium" | "hard"
  timeLimit: number // in minutes
  questions: MockQuestion[]
}

export const mockQuizzes: MockQuiz[] = [
  {
    id: "quiz-1",
    title: "JavaScript Fundamentals",
    description: "Test your knowledge of JavaScript basics and core concepts",
    category: "Programming",
    difficulty: "easy",
    timeLimit: 15,
    questions: [
      {
        id: "q1",
        text: "Which of the following is NOT a JavaScript data type?",
        explanation:
          "JavaScript has six primitive data types: String, Number, Boolean, Null, Undefined, and Symbol. Object is a non-primitive data type. Integer is not a separate data type in JavaScript; it falls under the Number type.",
        answers: [
          { id: "a1", text: "String", isCorrect: false },
          { id: "a2", text: "Number", isCorrect: false },
          { id: "a3", text: "Integer", isCorrect: true },
          { id: "a4", text: "Boolean", isCorrect: false },
        ],
      },
      {
        id: "q2",
        text: "What will the following code return: console.log(typeof [])?",
        explanation:
          "In JavaScript, arrays are actually objects, so typeof [] returns 'object'. This is one of the quirks of JavaScript's type system.",
        answers: [
          { id: "a5", text: "'array'", isCorrect: false },
          { id: "a6", text: "'object'", isCorrect: true },
          { id: "a7", text: "'list'", isCorrect: false },
          { id: "a8", text: "undefined", isCorrect: false },
        ],
      },
      {
        id: "q3",
        text: "Which method is used to add elements to the end of an array?",
        explanation:
          "The push() method adds one or more elements to the end of an array and returns the new length of the array.",
        answers: [
          { id: "a9", text: "append()", isCorrect: false },
          { id: "a10", text: "add()", isCorrect: false },
          { id: "a11", text: "push()", isCorrect: true },
          { id: "a12", text: "insert()", isCorrect: false },
        ],
      },
      {
        id: "q4",
        text: "What does the '===' operator do?",
        explanation:
          "The strict equality operator (===) checks whether its two operands are equal, returning a Boolean result. Unlike the equality operator (==), it doesn't perform type conversion when comparing values.",
        answers: [
          { id: "a13", text: "Checks for equality, but doesn't compare types", isCorrect: false },
          { id: "a14", text: "Checks for equality, including comparing types", isCorrect: true },
          { id: "a15", text: "Assigns a value to a variable", isCorrect: false },
          { id: "a16", text: "Checks if a variable exists", isCorrect: false },
        ],
      },
      {
        id: "q5",
        text: "Which function is used to parse a string to an integer in JavaScript?",
        explanation: "parseInt() parses a string argument and returns an integer of the specified radix or base.",
        answers: [
          { id: "a17", text: "Integer.parse()", isCorrect: false },
          { id: "a18", text: "parseInteger()", isCorrect: false },
          { id: "a19", text: "parseInt()", isCorrect: true },
          { id: "a20", text: "Number.toInteger()", isCorrect: false },
        ],
      },
    ],
  },
  {
    id: "quiz-2",
    title: "React Basics",
    description: "Test your knowledge of React fundamentals and concepts",
    category: "Programming",
    difficulty: "medium",
    timeLimit: 20,
    questions: [
      {
        id: "q6",
        text: "What is JSX in React?",
        explanation:
          "JSX (JavaScript XML) is a syntax extension for JavaScript that looks similar to HTML. It allows you to write HTML-like code in your JavaScript files, making it easier to describe what your UI should look like.",
        answers: [
          { id: "a21", text: "A JavaScript library", isCorrect: false },
          { id: "a22", text: "A syntax extension that allows writing HTML-like code in JavaScript", isCorrect: true },
          { id: "a23", text: "A build tool", isCorrect: false },
          { id: "a24", text: "A testing framework", isCorrect: false },
        ],
      },
      {
        id: "q7",
        text: "Which hook is used to perform side effects in a function component?",
        explanation:
          "useEffect is a React Hook that lets you synchronize a component with an external system. It's used for data fetching, subscriptions, or manually changing the DOM from React components.",
        answers: [
          { id: "a25", text: "useState", isCorrect: false },
          { id: "a26", text: "useContext", isCorrect: false },
          { id: "a27", text: "useEffect", isCorrect: true },
          { id: "a28", text: "useReducer", isCorrect: false },
        ],
      },
      {
        id: "q8",
        text: "What is the purpose of keys in React lists?",
        explanation:
          "Keys help React identify which items have changed, are added, or are removed. Keys should be given to the elements inside the array to give the elements a stable identity.",
        answers: [
          { id: "a29", text: "To style list items differently", isCorrect: false },
          {
            id: "a30",
            text: "To help React identify which items have changed, been added, or been removed",
            isCorrect: true,
          },
          { id: "a31", text: "To make lists sortable", isCorrect: false },
          { id: "a32", text: "To encrypt data in the list", isCorrect: false },
        ],
      },
    ],
  },
]

// Function to get a quiz by ID
export function getMockQuiz(id: string): MockQuiz | undefined {
  return mockQuizzes.find((quiz) => quiz.id === id)
}

// Function to get all quizzes
export function getAllMockQuizzes(): MockQuiz[] {
  return mockQuizzes
}
