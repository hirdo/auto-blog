---
title: "Under the Hood: 5 JavaScript Fundamentals Every Intermediate Dev Should Master"
tags: ["javascript","webdev","programming","tutorial"]
description: "Level up your JavaScript expertise by mastering Execution Contexts, Closures, 'this' binding, the Event Loop, and Prototypal Inheritance."
date_generated: "2026-08-31"
---

We’ve all been there: you can build full-stack web applications, write React components with ease, or deploy Node.js microservices, yet every now and then, a subtle JavaScript bug leaves you scratching your head for hours. 

Often, these bugs stem not from complex framework intricacies, but from a shaky understanding of **core JavaScript fundamentals**. 

In this article, we'll strip away the abstractions and look under the hood at five fundamental concepts that every intermediate JavaScript developer should deeply understand.

---

## 1. Execution Context and the Temporal Dead Zone

Before any JavaScript code runs, the JavaScript engine creates an **Execution Context**. Think of it as an environment that manages the code currently being evaluated.

An Execution Context consists of two phases:
1. **Creation Phase**: The engine allocates memory for variables and functions (Hoisting).
2. **Execution Phase**: The engine executes the code line-by-line.

### Hoisting: `var` vs. `let` / `const`

Many developers believe `let` and `const` aren't hoisted. They actually are, but they behave differently due to the **Temporal Dead Zone (TDZ)**.

```javascript
console.log(a); // Output: undefined (hoisted & initialized to undefined)
var a = 10;

console.log(b); // ReferenceError: Cannot access 'b' before initialization
let b = 20;
```

When `var` is hoisted, memory is allocated and immediately initialized with `undefined`. When `let` and `const` are hoisted, memory is allocated, but they remain **uninitialized**. The time between entering the scope and reaching the variable declaration is the Temporal Dead Zone.

---

## 2. Demystifying `this` Once and For All

The `this` keyword is notoriously confusing because its value is determined **how a function is called**, not where it is defined (with the exception of arrow functions).

Here are the 4 primary rules of `this` binding:

### Implicit Binding
When a function is called as a method of an object, `this` points to that object.

```javascript
const user = {
  name: 'Alex',
  greet() {
    console.log(`Hello, I am ${this.name}`);
  }
};

user.greet(); // Output: Hello, I am Alex
```

### Explicit Binding
Using `.call()`, `.apply()`, or `.bind()`, you explicitly define what `this` refers to.

```javascript
function showRole(role) {
  console.log(`${this.name} is a ${role}`);
}

const dev = { name: 'Sarah' };
showRole.call(dev, 'Frontend Engineer'); // Output: Sarah is a Frontend Engineer
```

### Arrow Functions
Arrow functions do **not** have their own `this`. They lexically bind `this`, inheriting it from the surrounding outer scope.

```javascript
const timer = {
  seconds: 0,
  start() {
    setInterval(() => {
      this.seconds++;
      console.log(this.seconds);
    }, 1000);
  }
};

timer.start(); // Works as expected because arrow function inherits 'this' from start()
```

---

## 3. Closures: Power, Memory, and Encapsulation

A **closure** is created when a function is defined inside another function, allowing the inner function to retain access to variables in the outer function's lexical scope—even after the outer function has finished executing.

### Practical Use Case: Data Encapsulation

JavaScript didn't always have private class fields (`#private`). Closures provided a way to create private variables.

```javascript
function createCounter() {
  let count = 0; // Private state

  return {
    increment() {
      count++;
      return count;
    },
    decrement() {
      count--;
      return count;
    },
    getCount() {
      return count;
    }
  };
}

const counter = createCounter();
console.log(counter.increment()); // 1
console.log(counter.increment()); // 2
console.log(counter.count);       // undefined (cannot be accessed directly!)
```

### Watch Out for Memory Leaks

Because closure variables are retained in memory as long as the inner function is reachable, holding references unnecessarily can prevent Garbage Collection and cause memory leaks.

---

## 4. The Event Loop: Microtasks vs. Macrotasks

JavaScript is single-threaded, meaning it can only perform one task at a time. Concurrency is handled by the **Event Loop**, which coordinates the Call Stack, Microtask Queue, and Macrotask (Callback) Queue.

### The Order of Execution

1. Execute all synchronous code on the **Call Stack**.
2. When the Call Stack is empty, execute **all** tasks in the **Microtask Queue** (Promises, `queueMicrotask`, `MutationObserver`).
3. Execute **one** task from the **Macrotask Queue** (`setTimeout`, `setInterval`, I/O, UI rendering).
4. Repeat.

Consider this classic interview question:

```javascript
console.log('1: Sync');

setTimeout(() => {
  console.log('2: Macrotask (setTimeout)');
}, 0);

Promise.resolve().then(() => {
  console.log('3: Microtask (Promise)');
});

console.log('4: Sync');
```

**Output:**
```
1: Sync
4: Sync
3: Microtask (Promise)
2: Macrotask (setTimeout)
```

Even with a delay of `0ms`, `setTimeout` must wait for the Microtask Queue to completely clear before it gets pushed onto the Call Stack.

---

## 5. Prototypal Inheritance Beyond `class` Syntax

ES6 introduced the `class` keyword, making JavaScript look like classic object-oriented languages. However, under the hood, JavaScript still uses **prototypal inheritance**.

Every object in JavaScript has a internal link to another object called its **prototype** (`[[Prototype]]`). When you attempt to access a property on an object, JavaScript searches the object itself first, then traverses up the prototype chain until it finds it or reaches `null`.

```javascript
function Person(name) {
  this.name = name;
}

Person.prototype.sayHi = function() {
  console.log(`Hi, my name is ${this.name}`);
};

const dev = new Person('Maya');

dev.sayHi(); // Output: Hi, my name is Maya
console.log(dev.__proto__ === Person.prototype); // true
```

Understanding this mechanic is critical when extending built-in objects, writing high-performance code, or working with legacy codebases.

---

## Conclusion

Frameworks come and go, but core JavaScript mechanics remain constant. Mastering execution contexts, scoping rules, `this` binding, closures, the event loop, and prototypes will make you a far better troubleshooter and architect.

The next time you encounter an unexpected value or asynchronous bug, take a step back and think about what the engine is doing behind the scenes!
