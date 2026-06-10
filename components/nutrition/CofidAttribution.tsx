export function CofidAttribution({ className ="" }: { className?: string }) {
 return (
 <p className={`text-xs text-[var(--text-muted)] ${className}`.trim()}>
 Nutrition data: McCance &amp; Widdowson&apos;s Composition of Foods Integrated Dataset 2021,{""}
 <a
 href="https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid"
 target="_blank"
 rel="noopener noreferrer"
 className="underline hover:text-[var(--text-secondary)]"
 >
 © Crown Copyright
 </a>
 . Used under Open Government Licence v3.0.
 </p>
 );
}
