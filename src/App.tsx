   import { useState } from 'react';
   import { useForm, type SubmitHandler } from 'react-hook-form';
   import {
     Chart as ChartJS,
     RadialLinearScale,
     PointElement,
     LineElement,
     Filler,
     Tooltip,
     Legend,
   } from 'chart.js';
   import { Radar } from 'react-chartjs-2';
   
   ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);
   
   /* --------------------------------------------------------------
      Types and interfaces for form fields
      -------------------------------------------------------------- */
   type ContentType = 'educational' | 'non-educational' | 'background' | 'interactive';
   type ParentalInvolvement = 'instructive' | 'co-viewing' | 'unmediated';
   type YesNo = 'yes' | 'no';
   
   interface FormValues {
     contentType: ContentType;
     duration: number;          // hours / day
     frequency: number;         // sessions / week
     age: number;               // months (12-60)
     parentalInvolvement: ParentalInvolvement;
     simultaneousUse: YesNo;
     backgroundFreq: number;    // 0-5
     maternalScreenTime: number; // hours / day
     maternalMentalHealth: YesNo;
   }
   
   interface Scores {
     vocabulary: number;
     mentalVerb: number;
     expressive: number;
     verbalInteraction: number;
     sentenceComp: number;
     socialLang: number;
   }
   
   /* --------------------------------------------------------------
      main component
      -------------------------------------------------------------- */
   export default function App() {
     const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>();
     const [results, setResults] = useState<{
       scores: Scores;
       harmLevel: 'Low' | 'Medium' | 'High';
       suggestions: string;
     } | null>(null);
   
     // check if form is emoty 
     const formValues = watch();
     const isFormEmpty = !formValues.contentType && 
                         !formValues.duration && 
                         !formValues.frequency && 
                         !formValues.age && 
                         !formValues.parentalInvolvement && 
                         !formValues.simultaneousUse && 
                         !formValues.backgroundFreq && 
                         !formValues.maternalScreenTime && 
                         !formValues.maternalMentalHealth;
   
     const onSubmit: SubmitHandler<FormValues> = (data) => {
       // -----------------------------------------------------------------
       // 1. Initialise neutral scores (5 = neutral, 0-10 scale)
       // -----------------------------------------------------------------
       const scores: Scores = {
         vocabulary: 5,
         mentalVerb: 5,
         expressive: 5,
         verbalInteraction: 5,
         sentenceComp: 5,
         socialLang: 5,
       };
   
       // -----------------------------------------------------------------
       // 2. Rule-based modifiers (derived from cited papers)
       // -----------------------------------------------------------------
       // Content type
       switch (data.contentType) {
         case 'educational':
           scores.vocabulary += 2;
           scores.mentalVerb += 2;
           scores.sentenceComp += 1;
           break;
         case 'non-educational':
           scores.vocabulary -= 2;
           scores.expressive -= 1;
           scores.socialLang -= 1;
           break;
         case 'background':
           scores.verbalInteraction -= 3;
           scores.expressive -= 2;
           scores.socialLang -= 2;
           break;
         case 'interactive':
           scores.expressive += 1;
           scores.socialLang += 2;
           scores.mentalVerb += 1;
           break;
       }
   
       // Parental involvement
       switch (data.parentalInvolvement) {
         case 'instructive':
           Object.keys(scores).forEach((k) => (scores[k as keyof Scores] += 2));
           break;
         case 'co-viewing':
           scores.verbalInteraction += 2;
           scores.expressive += 1;
           break;
         case 'unmediated':
           Object.keys(scores).forEach((k) => (scores[k as keyof Scores] -= 2));
           break;
       }
   
       // Age thresholds
       if (data.age < 12) {
         Object.keys(scores).forEach((k) => (scores[k as keyof Scores] -= 2));
       } else if (data.age <= 36) {
         scores.vocabulary -= 1;
       }
   
       // Excessive use
       if (data.duration > 2 || data.frequency > 7) {
         Object.keys(scores).forEach((k) => (scores[k as keyof Scores] -= 1.5));
       }
   
       // Contextual factors
       if (data.simultaneousUse === 'yes') scores.verbalInteraction -= 1;
       if (data.backgroundFreq > 3) {
         scores.expressive -= 2;
         scores.verbalInteraction -= 2;
       }
       if (data.maternalScreenTime > 4) scores.socialLang -= 1;
       if (data.maternalMentalHealth === 'yes') scores.mentalVerb -= 1;
   
       // Clamp to 0-10
       Object.keys(scores).forEach((k) => {
         const key = k as keyof Scores;
         scores[key] = Math.max(0, Math.min(10, scores[key]));
       });
   
       // -----------------------------------------------------------------
       // 3. Overall harm level + suggestions
       // -----------------------------------------------------------------
       const avg = Object.values(scores).reduce((a, b) => a + b, 0) / 6;
       const harmLevel = avg > 7 ? 'Low' : avg > 4 ? 'Medium' : 'High';
       const suggestions =
         harmLevel === 'High'
           ? 'Reduce screen time, focus on mediated educational content, and increase direct interactions.'
           : harmLevel === 'Medium'
           ? 'Monitor usage; add more parental involvement for better outcomes.'
           : 'Current setup seems beneficial—continue with educational focus.';
   
       setResults({ scores, harmLevel, suggestions });
     };
   
     /* --------------------------------------------------------------
        frontend UI just a form and some results
        -------------------------------------------------------------- */
     return (
       <div style={{ padding: '2rem', maxWidth: '860px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
         <h1 style={{ textAlign: 'center' }}>Screen-Exposure Impact Predictor</h1>
   
         <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: '1rem' }}>
           {/* ---------- Content Type ---------- */}
           <div>
             <label>Content Type:</label>
             <select {...register('contentType', { required: true })} style={{ width: '100%' }}>
               <option value="educational">Educational / Narrative-Rich</option>
               <option value="non-educational">Non-Educational / Entertainment</option>
               <option value="background">Background / Passive</option>
               <option value="interactive">Interactive</option>
             </select>
             {errors.contentType && <p style={{ color: 'red' }}>Required</p>}
           </div>
   
          {/* ---------- Duration & Frequency ---------- */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div>
              <label>Duration (hrs/day):</label>
              <input type="number" step="0.5" min="0" {...register('duration', { required: true, min: 0 })} />
            </div>
            <div>
              <label>Frequency (sessions/week):</label>
              <input type="number" min="0" {...register('frequency', { required: true, min: 0 })} />
            </div>
          </div>
   
          {/* ---------- Age ---------- */}
          <div>
            <label>Child Age (months, 12-60):</label>
            <input
              type="number"
              min="0"
              {...register('age', { required: true, min: 12, max: 60 })}
              style={{ width: '100%' }}
            />
          </div>
   
           {/* ---------- Parental Involvement ---------- */}
           <div>
             <label>Parental Involvement:</label>
             <select {...register('parentalInvolvement', { required: true })} style={{ width: '100%' }}>
               <option value="instructive">Instructive Mediation</option>
               <option value="co-viewing">Co-Viewing / Verbal Interaction</option>
               <option value="unmediated">Unmediated</option>
             </select>
           </div>
   
           {/* ---------- Contextual Factors ---------- */}
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
             <div>
               <label>Simultaneous Screen Use:</label>
               <select {...register('simultaneousUse', { required: true })}>
                 <option value="yes">Yes</option>
                 <option value="no">No</option>
               </select>
             </div>
   
            <div>
              <label>Background Media (0-5):</label>
              <input type="number" min="0" {...register('backgroundFreq', { required: true, min: 0, max: 5 })} />
            </div>

            <div>
              <label>Maternal Screen Time (hrs/day):</label>
              <input type="number" step="0.5" min="0" {...register('maternalScreenTime', { required: true, min: 0 })} />
            </div>
   
             <div>
               <label>Maternal Mental-Health Symptoms:</label>
               <select {...register('maternalMentalHealth', { required: true })}>
                 <option value="yes">Yes</option>
                 <option value="no">No</option>
               </select>
             </div>
           </div>
   
          <button 
            type="submit" 
            disabled={isFormEmpty}
            style={{ 
              padding: '0.75rem', 
              fontSize: '1rem',
              opacity: isFormEmpty ? 0.5 : 1,
              cursor: isFormEmpty ? 'not-allowed' : 'pointer'
            }}
          >
            Predict Impact
          </button>
         </form>
   
         {/* ---------- Results ---------- */}
         {results && (
           <section style={{ marginTop: '3rem' }}>
             <h2 style={{ textAlign: 'center' }}>Predicted Language-Development Impact</h2>
   
             <p><strong>Harm Level:</strong> {results.harmLevel}</p>
             <p><strong>Suggestions:</strong> {results.suggestions}</p>
   
             <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
               <Radar
                 data={{
                   labels: [
                     'Vocabulary',
                     'Mental-Verb Comprehension',
                     'Expressive Language',
                     'Verbal Interaction Quality',
                     'Sentence Comprehension',
                     'Social Language',
                   ],
                   datasets: [
                     {
                       label: 'Impact Score (0-10)',
                       data: Object.values(results.scores),
                       backgroundColor: 'rgba(34, 202, 236, 0.2)',
                       borderColor: 'rgba(34, 202, 236, 1)',
                       borderWidth: 2,
                       pointBackgroundColor: 'rgba(34, 202, 236, 1)',
                     },
                   ],
                 }}
                 options={{
                   scales: { r: { min: 0, max: 10, ticks: { stepSize: 2 } } },
                   plugins: { legend: { position: 'top' as const } },
                 }}
               />
             </div>
           </section>
         )}
       </div>
     );
   }