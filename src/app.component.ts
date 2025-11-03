import { Component, ChangeDetectionStrategy, signal, inject, WritableSignal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeminiService } from './services/gemini.service';
import { ContractInput, Party, GenerationResult, Contact, PartyValidationErrors, ContractValidationErrors } from './models';

// FIX: Replaced invalid file content with a complete and functional Angular component.
@Component({
  selector: 'app-root',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-slate-100 min-h-screen text-slate-900 font-sans">
      <header class="bg-white shadow-md sticky top-0 z-10">
        <div class="max-w-7xl mx-auto py-5 px-4 sm:px-6 lg:px-8">
          <h1 class="text-4xl font-bold text-slate-900 tracking-tight">AI Contract Drafter</h1>
        </div>
      </header>

      <main class="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <form (submit)="$event.preventDefault(); generateContract()">
          <!-- Contract Details -->
          <section class="bg-white p-8 rounded-xl shadow-lg mb-10">
            <h2 class="text-3xl font-bold text-slate-900 mb-6 border-b border-slate-300 pb-4">1. Detalji Ugovora</h2>
            <div class="grid grid-cols-1 gap-8">
              <div>
                <label for="contract_title" class="block text-lg font-bold text-slate-700 mb-2">Naslov Ugovora</label>
                <input type="text" id="contract_title" [value]="contractInput().contract_title" (input)="onContractDetailChange($event, 'contract_title')" class="mt-1 block w-full rounded-lg border-slate-400 bg-white text-black shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent sm:text-lg transition-all duration-200 p-3" />
                @if (contractInput().validationErrors?.contract_title) {
                  <p class="text-red-500 text-sm mt-2">{{ contractInput().validationErrors.contract_title }}</p>
                }
              </div>
              <div>
                <label for="contract_purpose" class="block text-lg font-bold text-slate-700 mb-2">Svrha/Predmet Ugovora</label>
                <textarea id="contract_purpose" rows="4" [value]="contractInput().contract_purpose" (input)="onContractDetailChange($event, 'contract_purpose')" class="mt-1 block w-full rounded-lg border-slate-400 bg-white text-black shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent sm:text-lg transition-all duration-200 p-3"></textarea>
                @if (contractInput().validationErrors?.contract_purpose) {
                  <p class="text-red-500 text-sm mt-2">{{ contractInput().validationErrors.contract_purpose }}</p>
                }
              </div>
            </div>
          </section>

          <!-- Parties -->
          <section class="mb-10">
            <div class="flex justify-between items-center mb-6 border-b border-slate-300 pb-4">
                <h2 class="text-3xl font-bold text-slate-900">2. Strane u Ugovoru</h2>
                <button type="button" (click)="addParty()" class="bg-indigo-500 text-white hover:bg-indigo-600 font-semibold rounded-lg text-base px-5 py-2.5 transition-colors shadow-sm inline-flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                    Dodaj Stranu
                </button>
            </div>
            <div class="space-y-8">
                @for (party of contractInput().parties; track party.id; let i = $index) {
                    <div class="bg-white p-8 rounded-xl shadow-lg relative">
                        <h3 class="text-2xl font-semibold mb-6 text-slate-800">Strana {{ i + 1 }}</h3>
                        @if (contractInput().parties.length > 1) {
                            <button type="button" (click)="removeParty(party.id)" class="absolute top-6 right-6 text-3xl font-bold text-slate-400 hover:text-red-600 transition-colors">&times;</button>
                        }
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <!-- Party Details -->
                            <div>
                                <label [for]="'role-' + party.id" class="block text-lg font-bold text-slate-700 mb-2">Uloga (npr. Najmodavac)</label>
                                <input type="text" [id]="'role-' + party.id" [value]="party.role" (input)="onPartyDetailChange($event, party.id, 'role')" class="mt-1 block w-full rounded-lg border-slate-400 bg-white text-black shadow-sm sm:text-lg p-3 focus:ring-2 focus:ring-indigo-400 focus:border-transparent" />
                                @if (party.validationErrors?.role) { <p class="text-red-500 text-sm mt-2">{{ party.validationErrors.role }}</p> }
                            </div>
                            <div>
                                <label [for]="'name-' + party.id" class="block text-lg font-bold text-slate-700 mb-2">Ime i Prezime / Naziv Tvrtke</label>
                                <input type="text" [id]="'name-' + party.id" [value]="party.name" (input)="onPartyDetailChange($event, party.id, 'name')" class="mt-1 block w-full rounded-lg border-slate-400 bg-white text-black shadow-sm sm:text-lg p-3 focus:ring-2 focus:ring-indigo-400 focus:border-transparent" />
                                 @if (party.validationErrors?.name) { <p class="text-red-500 text-sm mt-2">{{ party.validationErrors.name }}</p> }
                            </div>
                            <div>
                                <label [for]="'oib-' + party.id" class="block text-lg font-bold text-slate-700 mb-2">OIB ili ID Broj</label>
                                <input type="text" [id]="'oib-' + party.id" [value]="party.oib_or_id" (input)="onPartyDetailChange($event, party.id, 'oib_or_id')" class="mt-1 block w-full rounded-lg border-slate-400 bg-white text-black shadow-sm sm:text-lg p-3 focus:ring-2 focus:ring-indigo-400 focus:border-transparent" />
                                @if (party.validationErrors?.oib_or_id) { <p class="text-red-500 text-sm mt-2">{{ party.validationErrors.oib_or_id }}</p> }
                            </div>
                            <div>
                                <label [for]="'address-' + party.id" class="block text-lg font-bold text-slate-700 mb-2">Adresa</label>
                                <input type="text" [id]="'address-' + party.id" [value]="party.address" (input)="onPartyDetailChange($event, party.id, 'address')" class="mt-1 block w-full rounded-lg border-slate-400 bg-white text-black shadow-sm sm:text-lg p-3 focus:ring-2 focus:ring-indigo-400 focus:border-transparent" />
                                @if (party.validationErrors?.address) { <p class="text-red-500 text-sm mt-2">{{ party.validationErrors.address }}</p> }
                            </div>
                             <div>
                                <label [for]="'email-' + party.id" class="block text-lg font-bold text-slate-700 mb-2">Email</label>
                                <input type="email" [id]="'email-' + party.id" [value]="party.contacts.email" (input)="onPartyContactChange($event, party.id, 'email')" class="mt-1 block w-full rounded-lg border-slate-400 bg-white text-black shadow-sm sm:text-lg p-3 focus:ring-2 focus:ring-indigo-400 focus:border-transparent" />
                            </div>
                            <div>
                                <label [for]="'phone-' + party.id" class="block text-lg font-bold text-slate-700 mb-2">Telefon</label>
                                <input type="tel" [id]="'phone-' + party.id" [value]="party.contacts.phone" (input)="onPartyContactChange($event, party.id, 'phone')" class="mt-1 block w-full rounded-lg border-slate-400 bg-white text-black shadow-sm sm:text-lg p-3 focus:ring-2 focus:ring-indigo-400 focus:border-transparent" />
                            </div>
                        </div>

                        <!-- ID Card OCR -->
                        <div class="mt-8 border-t border-slate-300 pt-6">
                            <h4 class="text-xl font-semibold text-slate-900 mb-2">Sken Osobne Iskaznice (Opcionalno)</h4>
                            <p class="text-base text-slate-600 mb-4">Učitajte slike osobne iskaznice za automatsko popunjavanje podataka pomoću AI.</p>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <!-- Front Side -->
                                <div>
                                    <label [for]="'id-front-' + party.id" class="block text-lg font-bold text-slate-700 mb-2">Prednja Strana</label>
                                    <input type="file" [id]="'id-front-' + party.id" (change)="handleIdCardUpload(party.id, 'front', $event)" accept="image/*" class="mt-1 block w-full text-base text-slate-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"/>
                                    @if(isLoading()['ocr_' + party.id + '_front']) {
                                        <p class="text-sm text-indigo-600 mt-2 flex items-center"><span class="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></span>Analiziram prednju stranu...</p>
                                    }
                                    @if (party.id_card_image_front_text) {
                                        <div class="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-300">
                                            <h5 class="text-base font-semibold text-slate-800">Ekstrahirani Tekst (Prednja):</h5>
                                            <pre class="text-base whitespace-pre-wrap font-mono bg-white p-3 rounded mt-2 max-h-40 overflow-y-auto border border-slate-300">{{ party.id_card_image_front_text }}</pre>
                                            @if (party.id_card_front_uncertain_fields && party.id_card_front_uncertain_fields.length > 0) {
                                                <h5 class="text-base font-semibold mt-3 text-amber-700">Nesigurna Polja:</h5>
                                                <ul class="text-sm list-disc pl-5 mt-1 space-y-1">
                                                    @for(field of party.id_card_front_uncertain_fields; track field.field) {
                                                        <li class="text-amber-600"><strong>{{ field.field }}:</strong> {{ field.value }} (<em>{{ field.reason }}</em>)</li>
                                                    }
                                                </ul>
                                            }
                                        </div>
                                    }
                                </div>
                                <!-- Back Side -->
                                <div>
                                    <label [for]="'id-back-' + party.id" class="block text-lg font-bold text-slate-700 mb-2">Stražnja Strana</label>
                                    <input type="file" [id]="'id-back-' + party.id" (change)="handleIdCardUpload(party.id, 'back', $event)" accept="image/*" class="mt-1 block w-full text-base text-slate-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"/>
                                    @if(isLoading()['ocr_' + party.id + '_back']) {
                                        <p class="text-sm text-indigo-600 mt-2 flex items-center"><span class="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></span>Analiziram stražnju stranu...</p>
                                    }
                                    @if (party.id_card_image_back_text) {
                                        <div class="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-300">
                                            <h5 class="text-base font-semibold text-slate-800">Ekstrahirani Tekst (Stražnja):</h5>
                                            <pre class="text-base whitespace-pre-wrap font-mono bg-white p-3 rounded mt-2 max-h-40 overflow-y-auto border border-slate-300">{{ party.id_card_image_back_text }}</pre>
                                            @if (party.id_card_back_uncertain_fields && party.id_card_back_uncertain_fields.length > 0) {
                                                <h5 class="text-base font-semibold mt-3 text-amber-700">Nesigurna Polja:</h5>
                                                <ul class="text-sm list-disc pl-5 mt-1 space-y-1">
                                                    @for(field of party.id_card_back_uncertain_fields; track field.field) {
                                                        <li class="text-amber-600"><strong>{{ field.field }}:</strong> {{ field.value }} (<em>{{ field.reason }}</em>)</li>
                                                    }
                                                </ul>
                                            }
                                        </div>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                }
            </div>
          </section>

          <!-- Additional Instructions -->
          <section class="bg-white p-8 rounded-xl shadow-lg mb-10">
            <h2 class="text-3xl font-bold text-slate-900 mb-6 border-b border-slate-300 pb-4">3. Dodatne Upute</h2>
            <div>
              <label for="additional_instructions" class="block text-lg font-bold text-slate-700 mb-2">Posebni zahtjevi, klauzule ili napomene</label>
              <textarea id="additional_instructions" rows="4" [value]="contractInput().additional_instructions" (input)="onContractDetailChange($event, 'additional_instructions')" class="mt-1 block w-full rounded-lg border-slate-400 bg-white text-black shadow-sm sm:text-lg p-3 focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder:text-slate-500" placeholder="npr. 'Koristi jednostavan jezik', 'Uključi klauzulu o povjerljivosti...'"></textarea>
            </div>
          </section>

          <!-- Actions -->
          <section class="flex items-center justify-end p-6 bg-slate-200 rounded-xl shadow-inner">
            <button type="submit" [disabled]="isContractGenerationDisabled()" class="inline-flex items-center justify-center rounded-lg border border-transparent bg-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors">
              @if (isLoading()['contract']) {
                <span class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></span>
                <span>Generiram...</span>
              } @else {
                <span>Generiraj Nacrt Ugovora</span>
              }
            </button>
          </section>
        </form>

        <!-- Error Display -->
        @if (error()) {
            <div class="mt-10 p-5 bg-red-100 border-l-4 border-red-500 text-red-800 rounded-lg shadow-md">
                <p><strong>Greška:</strong> {{ error() }}</p>
            </div>
        }

        <!-- Results -->
        @if (generationResult()) {
            <section class="mt-12">
                <h2 class="text-4xl font-bold text-slate-900 mb-8 border-b border-slate-400 pb-4">Generirani Nacrt Ugovora</h2>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div class="bg-white p-8 rounded-xl shadow-lg">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-3xl font-semibold text-slate-900">Prikaz Ugovora</h3>
                            <div class="flex items-center space-x-3">
                                @if (copySuccess()) {
                                    <span class="text-green-600 text-sm font-semibold transition-opacity duration-300">Kopirano!</span>
                                }
                                <button type="button" (click)="copyMarkdownToClipboard()" class="bg-slate-200 text-slate-800 hover:bg-slate-300 font-medium rounded-lg text-sm px-4 py-2 text-center inline-flex items-center transition-colors">
                                    <svg class="w-4 h-4 mr-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 20"><path d="M16 1h-3.278A1.992 1.992 0 0 0 11 0H7a1.992 1.992 0 0 0-1.722 1H2a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2Zm-3 14H5a1 1 0 0 1 0-2h8a1 1 0 0 1 0 2Zm0-4H5a1 1 0 0 1 0-2h8a1 1 0 0 1 0 2Zm0-4H5a1 1 0 0 1 0-2h8a1 1 0 1 1 0 2Z"/></svg>
                                    Kopiraj
                                </button>
                            </div>
                        </div>
                        <div class="mt-4 p-6 bg-slate-50 rounded-lg border border-slate-300 max-h-[45rem] overflow-y-auto">
                            <pre class="text-lg whitespace-pre-wrap font-mono text-slate-900">{{ generationResult().markdown }}</pre>
                        </div>
                    </div>
                    <div class="bg-slate-800 text-slate-200 p-8 rounded-xl shadow-lg">
                        <h3 class="text-3xl font-semibold mb-4 text-white">JSON Metadata</h3>
                        <div class="mt-4 p-6 bg-slate-900 rounded-lg border border-slate-700 max-h-[45rem] overflow-y-auto">
                           <pre class="text-lg whitespace-pre-wrap font-mono">{{ generationResult().json }}</pre>
                        </div>
                    </div>
                </div>
            </section>
        }
      </main>
    </div>
  `,
  styles: [`
    /* Using TailwindCSS via CDN, no additional global styles needed here. */
  `]
})
export class AppComponent {
  private geminiService = inject(GeminiService);

  contractInput: WritableSignal<ContractInput> = signal({
    contract_title: 'Ugovor o najmu stana',
    contract_purpose: 'Reguliranje uvjeta najma stana na adresi Ilica 1, Zagreb, između najmodavca i najmoprimca.',
    parties: [],
    additional_instructions: '',
    validationErrors: {}
  });

  generationResult = signal<GenerationResult | null>(null);
  isLoading = signal<{ [key: string]: boolean }>({});
  error = signal<string | null>(null);
  copySuccess = signal(false);

  isContractGenerationDisabled = computed(() => {
    const loadingState = this.isLoading();
    return !!loadingState['contract'] || Object.keys(loadingState).some(k => k.startsWith('ocr_') && loadingState[k]);
  });
  
  constructor() {
    this.addParty();
  }

  private generateUniqueId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  addParty(): void {
    this.contractInput.update(current => ({
      ...current,
      parties: [
        ...current.parties,
        {
          id: this.generateUniqueId(),
          role: current.parties.length === 0 ? 'Najmodavac' : 'Najmoprimac',
          name: '',
          oib_or_id: '',
          address: '',
          contacts: { email: '', phone: '' },
          validationErrors: {}
        }
      ]
    }));
  }

  removeParty(partyId: string): void {
    this.contractInput.update(current => ({
      ...current,
      parties: current.parties.filter(p => p.id !== partyId)
    }));
  }

  onContractDetailChange(event: Event, field: 'contract_title' | 'contract_purpose' | 'additional_instructions'): void {
    const value = (event.target as HTMLInputElement).value;
    this.contractInput.update(current => ({ ...current, [field]: value }));
  }

  onPartyDetailChange(event: Event, partyId: string, field: 'role' | 'name' | 'oib_or_id' | 'address'): void {
    const value = (event.target as HTMLInputElement).value;
    this.contractInput.update(current => ({
      ...current,
      parties: current.parties.map(p =>
        p.id === partyId ? { ...p, [field]: value } : p
      )
    }));
  }

  onPartyContactChange(event: Event, partyId: string, field: keyof Contact): void {
    const value = (event.target as HTMLInputElement).value;
    this.contractInput.update(current => ({
      ...current,
      parties: current.parties.map(p =>
        p.id === partyId ? { ...p, contacts: { ...p.contacts, [field]: value } } : p
      )
    }));
  }
  
  async handleIdCardUpload(partyId: string, side: 'front' | 'back', event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }
    const file = input.files[0];
    const mimeType = file.type;

    try {
      const base64 = await this.fileToBase64(file);
      
      this.contractInput.update(current => ({
        ...current,
        parties: current.parties.map(p => {
          if (p.id !== partyId) return p;
          const updatedParty = { ...p };
          if (side === 'front') {
            updatedParty.id_card_image_front_b64 = base64;
          } else {
            updatedParty.id_card_image_back_b64 = base64;
          }
          return updatedParty;
        })
      }));

      await this.analyzeIdCard(partyId, side, base64, mimeType);
    } catch (e) {
      this.error.set(`Error processing file: ${(e as Error).message}`);
    } finally {
        input.value = '';
    }
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64Content = result.split(',')[1];
        if (!base64Content) {
            reject(new Error("Could not extract base64 content from file."));
        } else {
            resolve(base64Content);
        }
      };
      reader.onerror = error => reject(error);
    });
  }

  async analyzeIdCard(partyId: string, side: 'front' | 'back', base64: string, mimeType: string): Promise<void> {
    const loadingKey = `ocr_${partyId}_${side}`;
    this.isLoading.update(l => ({ ...l, [loadingKey]: true }));
    this.error.set(null);

    try {
      const result = await this.geminiService.analyzeImage(base64, mimeType);

      this.contractInput.update(current => ({
        ...current,
        parties: current.parties.map(p => {
          if (p.id !== partyId) return p;
          const updatedParty = { ...p };
          if (side === 'front') {
            updatedParty.id_card_image_front_text = result.rawText;
            updatedParty.id_card_front_uncertain_fields = result.uncertainFields;
          } else {
            updatedParty.id_card_image_back_text = result.rawText;
            updatedParty.id_card_back_uncertain_fields = result.uncertainFields;
          }
          return updatedParty;
        })
      }));
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.isLoading.update(l => ({ ...l, [loadingKey]: false }));
    }
  }

  async generateContract(): Promise<void> {
    if (!this.validateInput()) return;

    const loadingKey = 'contract';
    this.isLoading.update(l => ({ ...l, [loadingKey]: true }));
    this.error.set(null);
    this.generationResult.set(null);

    try {
      const result = await this.geminiService.generateContract(this.contractInput());
      this.generationResult.set(result);
      window.scrollTo(0, document.body.scrollHeight);
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.isLoading.update(l => ({ ...l, [loadingKey]: false }));
    }
  }
  
  validateInput(): boolean {
    const input = this.contractInput();
    let isValid = true;
    const contractErrors: ContractValidationErrors = {};
    if (!input.contract_title.trim()) {
      contractErrors.contract_title = 'Naslov ugovora je obavezan.';
      isValid = false;
    }
    if (!input.contract_purpose.trim()) {
      contractErrors.contract_purpose = 'Svrha ugovora je obavezna.';
      isValid = false;
    }

    const updatedParties = input.parties.map(p => {
      const partyErrors: PartyValidationErrors = {};
      if (!p.role.trim()) {
        partyErrors.role = 'Uloga je obavezna.';
        isValid = false;
      }
      if (!p.name.trim()) {
        partyErrors.name = 'Ime je obavezno.';
        isValid = false;
      }
      if (!p.oib_or_id.trim()) {
        partyErrors.oib_or_id = 'OIB/ID je obavezan.';
        isValid = false;
      }
      if (!p.address.trim()) {
        partyErrors.address = 'Adresa je obavezna.';
        isValid = false;
      }
      return { ...p, validationErrors: partyErrors };
    });

    this.contractInput.update(current => ({
      ...current,
      parties: updatedParties,
      validationErrors: contractErrors
    }));

    return isValid;
  }

  async copyMarkdownToClipboard(): Promise<void> {
    const result = this.generationResult();
    if (!result?.markdown) return;

    try {
      await navigator.clipboard.writeText(result.markdown);
      this.copySuccess.set(true);
      setTimeout(() => this.copySuccess.set(false), 2000); // Hide message after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
      this.error.set('Could not copy text to clipboard.');
    }
  }
}