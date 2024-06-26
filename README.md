# Behavior Tree

A simple implementation of a behavior tree with a demo that can be
played with [here](http://0xABAD.github.io/behavior_tree).

## Introduction

Behavior trees are a technique used in video games and robotics to
model behavior AI.  Their use has become increasingly popular due to
their simple implementation, ease of understanding, and flexibility.
This README won't go into all the detail here but a cursory web search
will provide a plethora of information.

This project provides a simple demo to load and interact with a
behavior tree.  The values of conditions and actions can be switched
by clicking on them.

As one interacts with the tree by toggling conditons and actions the
implementation will show the paths of the tree that have been explored
by filling in the explored nodes in a solid color.  Note that an
action or condition may be repeated within different parts of the tree
but an action or condition may be displayed with a solid color while
the exact same action or condition in another branch of the tree is
displayed only with an outline of the same color.  This illustrates
that the implementation does not explore the entire tree depending on
the organization of nodes and values of actions and conditions -- it
only seeks the most successful or running branch.

That last sentence mentions _successful_ and _running_, and that is
because a node may be one of three states:  _success_, _running_,
_failed_, and these states are denoted by the colors _green_, _blue_,
and _red_, respectively.  Note that condition nodes may be in a
_successful_ or _failed_ state, never _running_.

## Syntax

The demo allows the loading of any arbitrary tree and the syntax is
simple and easy to understand.  

The complete syntax will be discussed here.  There is a limited form
of error reporting as the parser will stop at the first error which
will then be displayed directly on the page with the line number that
it occurred on.  A correct tree must have exactly one root node.

### Fallback Node

A fallback node is written with a question mark, `?`, and will choose
the first child that evaluates to _success_ or _running_.  If all
children nodes have _failed_ then the fallback node will be _failed_
as well.  Fallback nodes resemble an *OR* operator of programming
languages with short-circuite behavior.

### Condition Node

A condition node is represented as `(name of condition)`.  A condition
represents a true or false state and as previously mentioned it may
never be in a running state.  Conditions form the backbone of a
behavior tree and are the key ingredient to influence its path to find
the current running behavior.  For the sake of this implementation
conditions are case sensitive when determining the state of a condition.

### Indentation Level

Indentation of a tree is marked with the `|` symbol and denotes one
level of indentation within the tree.  Multiple indentation markers
can be placed one after the other to increase the level of indentation
and thus increase the height of the tree.

With fallback and condition nodes along with indentation markers we
now have enough syntax to create a simple behavior tree.  Here we have
a tree with a height of one, has one fallback node, and two condition

```tree
?
|    (Condition One)
|    (Condition Two)
```

In this example, `(Condition One)` and `(Condition Two)` are child
nodes of the fallback node which will be in a _success_ state when
either of the children are in a _success_ state.

### Action Node

`[Some Action]` is the syntax for an action node.  Action nodes
specify _what_ should be done _when_ the action becomes active.  When
writing a tree, nodes are organized in order to have action nodes
becomes active so they can be _executed_ to carry the behavior of the
tree.  The component executing the action will report back whether the
action is _running_, _success_, or _failed_.

### Sequence Node

A sequence node is written with `->` and is in a _success_ state when
all of its children nodes are in a _success_ state.  Otherwise, the
state of the sequence node will be the state of the first child, whether
_failed_ or _running_.  A sequence node is akin to the *AND* operator
of many programming languages.

### Not Decorator

A condition node, and only condition nodes, may be decorated with the
not, `!`, decorator.  As is many programming languages this decorator
inverts the result of its condition, so `!(Have Free Space)` will be
in a _failed_ state when there is actually free space available.

### Parallel Node

The parallel node is written as `=N` where `N` is some positive
integer.  The parallel node, like fallback and sequence nodes, can
have an arbitrary number of children and is in a _success_ state when
the number of children in a _success_ state is greater than or equal
to `N`.  If number of children in a _failed_ state is greater than the
number of children in a _success_ state minus `N` then the parallel
node will be _failed_; otherwise, it will be considered _running_.

## Using BehaviorTree in your code

### Parsing behavior tree and executing it

The `BehaviorTree` may be used programmatically to execute the behavior modeled in the tree: