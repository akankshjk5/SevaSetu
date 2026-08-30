import type { CategoryId } from "./types";
import type { QuizQuestion } from "@/app/worker/passport/SkillQuiz";

/**
 * Short, practical questions per trade — the kind a supervisor would actually
 * ask. Electrician and plumber are deliberately absent: those trades need a
 * hands-on check at a centre, not a quiz.
 */
export const QUIZZES: Partial<Record<CategoryId, QuizQuestion[]>> = {
  cleaner: [
    {
      q: "A marble floor has a sticky patch. What do you use first?",
      options: ["Hard steel scrubber", "Mild soap water and a soft cloth", "Acid cleaner", "Dry brush only"],
      answer: 1,
    },
    {
      q: "In which order should a room be cleaned?",
      options: ["Floor first, then dusting", "Dust from top, then sweep, then mop", "Only mop", "Sweep after mopping"],
      answer: 1,
    },
    {
      q: "The family keeps separate cloths for kitchen and bathroom. Why?",
      options: ["To save money", "To stop germs spreading between rooms", "No reason", "To finish faster"],
      answer: 1,
    },
  ],
  cook: [
    {
      q: "Cooked dal is left out in summer. How long before it is unsafe?",
      options: ["About 2 hours", "8 hours", "One full day", "It never spoils"],
      answer: 0,
    },
    {
      q: "The family says one member has a peanut allergy. What do you do?",
      options: [
        "Use a little, it is fine",
        "Keep peanuts out completely and wash utensils used for them",
        "Only avoid whole peanuts",
        "Cook separately but use the same spoon",
      ],
      answer: 1,
    },
    {
      q: "Which is the right way to check if chicken is cooked through?",
      options: ["Colour outside", "No pink inside and juices run clear", "Cooking time only", "By smell"],
      answer: 1,
    },
  ],
  "house-helper": [
    {
      q: "You break a glass while cleaning. What is the right thing to do?",
      options: ["Hide the pieces", "Tell the family and clear it safely", "Leave it", "Blame someone else"],
      answer: 1,
    },
    {
      q: "The family is away and a stranger asks to enter. You should:",
      options: ["Let them in", "Refuse and call the family", "Take their number and let them wait inside", "Ignore them"],
      answer: 1,
    },
    {
      q: "Colour-run in the laundry is best avoided by:",
      options: ["Washing everything together", "Separating dark and light clothes", "Using hot water always", "Using more soap"],
      answer: 1,
    },
  ],
  gardener: [
    {
      q: "When is the best time to water plants in Jaipur summer?",
      options: ["Noon", "Early morning or evening", "Any time", "Only at night with heavy water"],
      answer: 1,
    },
    {
      q: "Leaves are yellow and soil stays wet. The likely problem is:",
      options: ["Too little water", "Overwatering / poor drainage", "Too much sun", "Old pot"],
      answer: 1,
    },
    {
      q: "Pruning is mainly done to:",
      options: ["Make the plant smaller only", "Remove dead growth and help new growth", "Kill insects", "Save water"],
      answer: 1,
    },
  ],
  mover: [
    {
      q: "A fridge must be moved. What is correct?",
      options: ["Lay it flat straight away", "Keep it upright and let it stand a few hours before switching on", "Switch it on immediately", "Tilt fully upside down"],
      answer: 1,
    },
    {
      q: "The safest way to lift a heavy box is:",
      options: ["Bend the back", "Bend the knees and keep the back straight", "Lift with one hand", "Drag it"],
      answer: 1,
    },
    {
      q: "Glass items should be packed with:",
      options: ["Nothing", "Paper or bubble wrap, marked fragile", "Heavy items on top", "Loose in a big box"],
      answer: 1,
    },
  ],
  mason: [
    {
      q: "A common cement:sand ratio for plaster work is:",
      options: ["1:1", "1:6", "1:20", "Only cement"],
      answer: 1,
    },
    {
      q: "Curing new concrete matters because:",
      options: ["It looks better", "It gains strength properly and does not crack", "It dries faster", "It is cheaper"],
      answer: 1,
    },
    {
      q: "Before plastering, the wall surface should be:",
      options: ["Dry and dusty", "Cleaned and wetted", "Painted", "Oiled"],
      answer: 1,
    },
  ],
  carpenter: [
    {
      q: "Shuttering is removed only when:",
      options: ["The next day always", "The concrete has set enough for the member and span", "The contractor is in a hurry", "It rains"],
      answer: 1,
    },
    {
      q: "A door that rubs at the top is usually fixed by:",
      options: ["Removing the whole frame", "Planing the top edge and checking the hinges", "Adding more screws", "Painting it"],
      answer: 1,
    },
    {
      q: "Measuring twice before cutting saves:",
      options: ["Time only", "Material and rework", "Nothing", "Electricity"],
      answer: 1,
    },
  ],
  painter: [
    {
      q: "Primer is applied because:",
      options: ["It adds colour", "It seals the surface so paint holds and looks even", "It is cheaper than paint", "It is not needed"],
      answer: 1,
    },
    {
      q: "A wall with damp patches should be:",
      options: ["Painted straight away", "Treated for the damp source first", "Given extra coats", "Covered with tape"],
      answer: 1,
    },
    {
      q: "Putty on a wall is used to:",
      options: ["Add shine", "Fill and level small holes and cracks", "Stop insects", "Replace primer"],
      answer: 1,
    },
  ],
  "bar-bender": [
    {
      q: "A bar bending schedule tells you:",
      options: ["The paint colour", "Bar sizes, shapes, lengths and numbers", "The wage rate", "The site address"],
      answer: 1,
    },
    {
      q: "Cover blocks are used to:",
      options: ["Save steel", "Keep the correct concrete cover over the steel", "Make bending easier", "Mark the site"],
      answer: 1,
    },
    {
      q: "Steel with heavy rust flakes should be:",
      options: ["Used as it is", "Cleaned before use, and rejected if badly pitted", "Painted over", "Cut shorter"],
      answer: 1,
    },
  ],
  helper: [
    {
      q: "The correct thing to wear on a site is:",
      options: ["Slippers", "Helmet and closed shoes", "Nothing special", "Loose scarf near machines"],
      answer: 1,
    },
    {
      q: "You see a loose electrical wire on the ground. You should:",
      options: ["Move it by hand", "Tell the supervisor and keep people away", "Cover it with sand", "Ignore it"],
      answer: 1,
    },
    {
      q: "Mixing mortar properly means:",
      options: ["Adding as much water as possible", "Following the given ratio and mixing evenly", "Mixing only cement", "Mixing once a day"],
      answer: 1,
    },
  ],
};

export const PRACTICAL_TRADES: CategoryId[] = ["electrician", "plumber"];
