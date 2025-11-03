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
    <div class="bg-gray-50 min-h-screen text-gray-800 font-sans">
      <header class="bg-white shadow-md">
        <div class="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 class="text-2xl font-bold text-gray-900">AI Contract Drafter</h1>
        </div>
      </header>

      <main class="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <form (submit)="$event.preventDefault(); generateContract()">
          <!-- Contract Details -->
          <section class="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 class="text-xl font-semibold mb-4 border-b pb-2">1. Detalji Ugovora</h2>
            <div class="grid grid-cols-1 gap-6">
              <div>
                <label for="contract_title" class="block text-sm font-medium text-gray-700">Naslov Ugovora</label>
                <input type="text" id="contract_title" [value]="contractInput().contract_title" (input)="onContractDetailChange($event, 'contract_title')" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                @if (contractInput().validationErrors?.contract_title) {
                  <p class="text-red-500 text-sm mt-1">{{ contractInput().validationErrors.contract_title }}</p>
                }
              </div>
              <div>
                <label for="contract_purpose" class="block text-sm font-medium text-gray-700">Svrha/Predmet Ugovora</label>
                <textarea id="contract_purpose" rows="4" [value]="contractInput().contract_purpose" (input)="onContractDetailChange($event, 'contract_purpose')" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"></textarea>
                @if (contractInput().validationErrors?.contract_purpose) {
                  <p class="text-red-500 text-sm mt-1">{{ contractInput().validationErrors.contract_purpose }}</p>
                }
              </div>
            </div>
          </section>

          <!-- Parties -->
          <section class="mb-8">
            <div class="flex justify-between items-center mb-4 border-b pb-2">
                <h2 class="text-xl font-semibold">2. Strane u Ugovoru</h2>
                <button type="button" (click)="addParty()" class="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 font-medium rounded-lg text-sm px-4 py-2 text-center">
                    + Dodaj Stranu
                </button>
            </div>
            <div class="space-y-6">
                @for (party of contractInput().parties; track party.id; let i = $index) {
                    <div class="bg-white p-6 rounded-lg shadow-md relative">
                        <h3 class="text-lg font-semibold mb-4">Strana {{ i + 1 }}</h3>
                        @if (contractInput().parties.length > 1) {
                            <button type="button" (click)="removeParty(party.id)" class="absolute top-4 right-4 text-2xl font-bold text-gray-400 hover:text-red-600">&times;</button>
                        }
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <!-- Party Details -->
                            <div>
                                <label [for]="'role-' + party.id" class="block text-sm font-medium text-gray-700">Uloga (npr. Najmodavac)</label>
                                <input type="text" [id]="'role-' + party.id" [value]="party.role" (input)="onPartyDetailChange($event, party.id, 'role')" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
                                @if (party.validationErrors?.role) { <p class="text-red-500 text-sm mt-1">{{ party.validationErrors.role }}</p> }
                            </div>
                            <div>
                                <label [for]="'name-' + party.id" class="block text-sm font-medium text-gray-700">Ime i Prezime / Naziv Tvrtke</label>
                                <input type="text" [id]="'name-' + party.id" [value]="party.name" (input)="onPartyDetailChange($event, party.id, 'name')" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
                                 @if (party.validationErrors?.name) { <p class="text-red-500 text-sm mt-1">{{ party.validationErrors.name }}</p> }
                            </div>
                            <div>
                                <label [for]="'oib-' + party.id" class="block text-sm font-medium text-gray-700">OIB ili ID Broj</label>
                                <input type="text" [id]="'oib-' + party.id" [value]="party.oib_or_id" (input)="onPartyDetailChange($event, party.id, 'oib_or_id')" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
                                @if (party.validationErrors?.oib_or_id) { <p class="text-red-500 text-sm mt-1">{{ party.validationErrors.oib_or_id }}</p> }
                            </div>
                            <div>
                                <label [for]="'address-' + party.id" class="block text-sm font-medium text-gray-700">Adresa</label>
                                <input type="text" [id]="'address-' + party.id" [value]="party.address" (input)="onPartyDetailChange($event, party.id, 'address')" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
                                @if (party.validationErrors?.address) { <p class="text-red-500 text-sm mt-1">{{ party.validationErrors.address }}</p> }
                            </div>
                             <div>
                                <label [for]="'email-' + party.id" class="block text-sm font-medium text-gray-700">Email</label>
                                <input type="email" [id]="'email-' + party.id" [value]="party.contacts.email" (input)="onPartyContactChange($event, party.id, 'email')" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
                            </div>
                            <div>
                                <label [for]="'phone-' + party.id" class="block text-sm font-medium text-gray-700">Telefon</label>
                                <input type="tel" [id]="'phone-' + party.id" [value]="party.contacts.phone" (input)="onPartyContactChange($event, party.id, 'phone')" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
                            </div>
                        </div>

                        <!-- ID Card OCR -->
                        <div class="mt-6 border-t pt-4">
                            <h4 class="text-md font-semibold text-gray-800 mb-2">Sken Osobne Iskaznice (Opcionalno)</h4>
                            <p class="text-sm text-gray-500 mb-4">Učitajte slike osobne iskaznice za automatsko popunjavanje podataka pomoću AI.</p>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <!-- Front Side -->
                                <div>
                                    <label [for]="'id-front-' + party.id" class="block text-sm font-medium text-gray-700">Prednja Strana</label>
                                    <input type="file" [id]="'id-front-' + party.id" (change)="handleIdCardUpload(party.id, 'front', $event)" accept="image/*" class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
                                    @if(isLoading()['ocr_' + party.id + '_front']) {
                                        <p class="text-sm text-indigo-600 mt-2">Analiziram prednju stranu...</p>
                                    }
                                    @if (party.id_card_image_front_text) {
                                        <div class="mt-2 p-3 bg-gray-50 rounded-md border">
                                            <h5 class="text-sm font-semibold">Ekstrahirani Tekst (Prednja):</h5>
                                            <pre class="text-xs whitespace-pre-wrap font-mono bg-white p-2 rounded mt-1 max-h-40 overflow-y-auto">{{ party.id_card_image_front_text }}</pre>
                                            @if (party.id_card_front_uncertain_fields && party.id_card_front_uncertain_fields.length > 0) {
                                                <h5 class="text-sm font-semibold mt-2 text-amber-700">Nesigurna Polja:</h5>
                                                <ul class="text-xs list-disc pl-5 mt-1">
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
                                    <label [for]="'id-back-' + party.id" class="block text-sm font-medium text-gray-700">Stražnja Strana</label>
                                    <input type="file" [id]="'id-back-' + party.id" (change)="handleIdCardUpload(party.id, 'back', $event)" accept="image/*" class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
                                    @if(isLoading()['ocr_' + party.id + '_back']) {
                                        <p class="text-sm text-indigo-600 mt-2">Analiziram stražnju stranu...</p>
                                    }
                                    @if (party.id_card_image_back_text) {
                                        <div class="mt-2 p-3 bg-gray-50 rounded-md border">
                                            <h5 class="text-sm font-semibold">Ekstrahirani Tekst (Stražnja):</h5>
                                            <pre class="text-xs whitespace-pre-wrap font-mono bg-white p-2 rounded mt-1 max-h-40 overflow-y-auto">{{ party.id_card_image_back_text }}</pre>
                                            @if (party.id_card_back_uncertain_fields && party.id_card_back_uncertain_fields.length > 0) {
                                                <h5 class="text-sm font-semibold mt-2 text-amber-700">Nesigurna Polja:</h5>
                                                <ul class="text-xs list-disc pl-5 mt-1">
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
          <section class="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 class="text-xl font-semibold mb-4 border-b pb-2">3. Dodatne Upute</h2>
            <div>
              <label for="additional_instructions" class="block text-sm font-medium text-gray-700">Posebni zahtjevi, klauzule ili napomene</label>
              <textarea id="additional_instructions" rows="4" [value]="contractInput().additional_instructions" (input)="onContractDetailChange($event, 'additional_instructions')" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="npr. 'Koristi jednostavan jezik', 'Uključi klauzulu o povjerljivosti...'"></textarea>
            </div>
          </section>

          <!-- Actions -->
          <section class="flex items-center justify-end p-6 bg-gray-100 rounded-lg">
            <button type="submit" [disabled]="isContractGenerationDisabled()" class="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-300 disabled:cursor-not-allowed">
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
            <div class="mt-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                <p><strong>Greška:</strong> {{ error() }}</p>
            </div>
        }

        <!-- Results -->
        @if (generationResult()) {
            <section class="mt-8">
                <h2 class="text-2xl font-semibold mb-4 border-b pb-2">Generirani Nacrt Ugovora</h2>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div class="bg-white p-6 rounded-lg shadow-md">
                        <div class="flex justify-between items-center mb-3">
                            <h3 class="text-xl font-semibold">Prikaz Ugovora (Markdown)</h3>
                            <div class="flex items-center space-x-2">
                                @if (copySuccess()) {
                                    <span class="text-green-600 text-sm font-semibold transition-opacity duration-300">Kopirano!</span>
                                }
                                <button type="button" (click)="copyMarkdownToClipboard()" class="bg-gray-200 text-gray-700 hover:bg-gray-300 font-medium rounded-lg text-sm px-4 py-2 text-center inline-flex items-center">
                                    <svg class="w-4 h-4 mr-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 20"><path d="M16 1h-3.278A1.992 1.992 0 0 0 11 0H7a1.992 1.992 0 0 0-1.722 1H2a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2Zm-3 14H5a1 1 0 0 1 0-2h8a1 1 0 0 1 0 2Zm0-4H5a1 1 0 0 1 0-2h8a1 1 0 0 1 0 2Zm0-4H5a1 1 0 0 1 0-2h8a1 1 0 1 1 0 2Z"/></svg>
                                    Kopiraj
                                </button>
                            </div>
                        </div>
                        <div class="mt-2 p-3 bg-gray-50 rounded-md border max-h-[40rem] overflow-y-auto">
                            <pre class="text-sm whitespace-pre-wrap font-mono">{{ generationResult().markdown }}</pre>
                        </div>
                    </div>
                    <div class="bg-gray-800 text-white p-6 rounded-lg shadow-md">
                        <h3 class="text-xl font-semibold mb-3">JSON Metadata</h3>
                        <div class="mt-2 p-3 bg-gray-900 rounded-md border border-gray-700 max-h-[40rem] overflow-y-auto">
                           <pre class="text-sm whitespace-pre-wrap font-mono">{{ generationResult().json }}</pre>
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