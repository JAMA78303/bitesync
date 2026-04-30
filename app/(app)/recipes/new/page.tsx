import { RecipeForm } from "@/components/recipes/RecipeForm";

export default function NewRecipePage() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">New Recipe</h1>
        <p className="text-gray-600">
          Build your ingredient list and BiteSync will estimate macro and micro totals live.
        </p>
      </div>
      <RecipeForm />
    </section>
  );
}
