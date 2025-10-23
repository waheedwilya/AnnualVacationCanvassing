import VacationRequestForm from '../VacationRequestForm';

export default function VacationRequestFormExample() {
  return (
    <div className="p-6">
      <VacationRequestForm 
        availableWeeks={6}
        onSubmit={(first, second) => console.log('Form submitted', { first, second })}
      />
    </div>
  );
}
