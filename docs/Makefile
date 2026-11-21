SLIDES = presentation
LTX = pdflatex
BIB = bibtex

BUILD = build

LTX_FLAGS = -interaction=nonstopmode -file-line-error -halt-on-error \
						-output-directory=$(BUILD)

.PHONY: 

all: slides

slides: $(BUILD)/$(SLIDES).pdf

$(BUILD)/$(SLIDES).pdf: $(SLIDES).tex | $(BUILD)
	$(LTX) $(LTX_FLAGS) $(SLIDES).tex
	cd $(BUILD) && BIBINPUTS=..: $(BIB) $(SLIDES)
	$(LTX) $(LTX_FLAGS) $(SLIDES).tex
	$(LTX) $(LTX_FLAGS) $(SLIDES).tex

$(BUILD):
	mkdir $(BUILD)

clean:
	rm -rf $(BUILD)/*
