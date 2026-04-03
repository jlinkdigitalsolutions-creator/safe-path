type Props = {
  title?: string;
  description?: string;
};

export function HealthModuleIntro({
  title = "Women’s health support",
  description = "Vaccination SMS reminders, awareness (SMS/IVR-style messaging), and a searchable service directory for cervical and breast care.",

}: Props) {
  return (
    <div className="space-y-1">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
