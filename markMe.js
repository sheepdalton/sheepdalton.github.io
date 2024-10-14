
///------------------------------------------------------
/// BEgin by removing tabbing
document.getElementById('planCode').addEventListener('keydown', function(event) {
    if (event.key === 'Tab') {
        event.preventDefault(); // Prevent the default tab action (moving focus)

        // Get the current position of the cursor
        const start = this.selectionStart;
        const end = this.selectionEnd;

        // Set the value to the text before the tab + tab character + text after the tab
        this.value = this.value.substring(0, start) + '\t' + this.value.substring(end);

        // Put the cursor after the inserted tab
        this.selectionStart = this.selectionEnd = start + 1;
    }
});

//------------------------------------------------------
function squwashThis( value , range  )
{
    if( value == 0.0 )return 0.0;
    var atanResult = Math.atan(value / 4.0  );
    var result = atanResult * range;

    return result;
}
//------------------------------------------------------
function linesOfCodeToMark( count )
{
    if( count  == 0)return 0.0;

    var atanResult = Math.atan( ( count- 10) / (100-10) ) * 10 ;
    return atanResult;
}
//--------------------------------------------------
function calculateEntropyFromDict(counts)
{
    let total = 0;

    // Calculate the total number of observations
    for (let key in counts) {
        total += counts[key];
        console.log("tbl", key ,  counts[key]  , total);
    }

    if (total === 0) {
         console.log( "total is zero.");
        return 0;  // No entropy if there are no observations

    }

    // Calculate the entropy
    let entropy = 0;
    for (let key in counts) {
        let probability = counts[key] / total;
         console.log( key ,  counts[key], probability);
        if (probability > 0) {  // Avoid log(0)
            let p = probability * Math.log2(probability);
            console.log( key ,  counts[key], p);
            entropy -= p ;
        }
    }

    return entropy;
}
//------------------------------------------------------
function calculateSkewness(numbers) {
    let n = numbers.length;

    if (n < 3) {
        throw new Error("Skewness requires at least three numbers.");
    }

    // Calculate the mean
    let sum = 0;
    for (let i = 0; i < n; i++) {
        sum += numbers[i];
    }
    let mean = sum / n;

    // Calculate the standard deviation
    let varianceSum = 0;
    for (let i = 0; i < n; i++) {
        varianceSum += Math.pow(numbers[i] - mean, 2);
    }
    let stdDev = Math.sqrt(varianceSum / n);

    // Calculate the skewness
    let skewnessSum = 0;
    for (let i = 0; i < n; i++) {
        skewnessSum += Math.pow((numbers[i] - mean) / stdDev, 3);
    }

    let skewness = (n / ((n - 1) * (n - 2))) * skewnessSum;

    return skewness;
}

//------------------------------------------------------
/*
    Construct a table of depths. ( frequencey histogram )
    compute
    Fisher's moment coefficient of skewness ( needs mode and standard dev)
    compute entropy for the frequency table.

    A good table shows a normal distribution
    If skewed either way then bad.

    Add marks for size ( number of items ) 50% for number %50 for good distribution.



*/

function processThis()
{
    // Accessing the Python code from the textarea
    let expectedLines = 1500 ;
    var pythonCode = document.getElementById('planCode').value;

   // console.log( "Value ");

    let lines = pythonCode.split(/\r?\n/);
    let removeStrings = /"(?!(?<!")")([^"]*?)"/g;
    let  removeQuotes = /'(?!(?<!')')(.*?)'/g;
    // console.log( lines );
    let countTable = {};
    let counts = [ ];
    let linesOfCode = 0 ;
    let subsetGRoup = 0 ;
    let indetSample = "\n Intentation detection \n\n\r" ;


    for( const line of lines )
    {
          let indent = 0 ;
          let spaces = 0 ;
          let letters = 0;
          let leng = line.length ;
          if( line.length != 0 )
          {
              let clean = line.replace(/\s+/g, '');
              let clenLength = clean.length;
              linesOfCode += 1 ;  // remove ones with no text.

              for (let charv of line)
              {
                    if( charv === ' '){
                        spaces ++;
                    }else
                    {
                        if (charv === '\t')
                        {
                            indent++;
                        }else
                        {
                            letters ++ ;
                            break ;
                        }
                    }
              }
              let message = "" ;
              let depth = (spaces/4) + indent  ;

              if( spaces % 4 != 0 )
              {
                message = message + "Spaces must be a multiple of 4 ( or use tabs )";
              }
              counts.push(depth );
              let t = -1 ;
              let t2 = -1 ;
              if( depth in countTable )
              {
               t2 = countTable[depth ] ;
                countTable[depth ] = countTable[depth ] +1;
                t = countTable[depth ];
              } else
              {
                countTable[ depth ] = 1 ;
                t = countTable[depth ];
              }
              sample = clean.substring(0,10);
              console.log( ` ${spaces} ${indent}  d= ${depth}  ${t} t2= ${t2} ${clenLength} ${sample}  `);
              subsetGRoup += 1 ;
              if( subsetGRoup < 10 )
              {
                indetSample = indetSample + `--${depth}-- ${sample}... ${message} \n`;
              }
          }
          else
          {
            indetSample = indetSample + `BLANK LINES ARE MENINGLESS please remove \n`;
          }
    }// end of for

    /*
    console.log( " TABLE ");
    for (let key in countTable)
    {
        if (countTable.hasOwnProperty(key)) {  // Good practice to check for own properties
        console.log("k=",key, countTable[key]);
        }
    }
    console.log(" LIST ");
    for( let it in  counts )
    {
         console.log(it, counts[it]);
    }*/

    console.log("entropy",   Object.keys(countTable).length );
    entropy = calculateEntropyFromDict( countTable );

    elements = counts.length ;

    sckew = calculateSkewness(counts );
    lineMark = linesOfCodeToMark(    linesOfCode  );
    let feedBackText = "\n";

    if(lineMark < 0  )
    {
        feedBackText = feedBackText + 'Not enough lines of plan yet, your plan needs more detail.\n';
        lineMark = 0 ;
    }
    if(  Object.keys(countTable).length < 2 )
    {
         feedBackText = feedBackText + 'You are not using enough indentation (instant fail). This is NOT and essay it is indented todo list. ';
    }
    if( entropy < 1.2 )
    {
          feedBackText = feedBackText +
          "You do not have enough structure in your plan. Try more headings and sub headings. You need to tabs or groups of 4 spaces in make something indented. "
    }

    if( entropy > 4 )
    {
        feedBackText = feedBackText +
        "Your indentation isn't balanced enough. You need to improve your groupings."
    }
    // Displaying the feedback message in the feedback area
    let feedBackTop = `Skew ${sckew.toFixed(4)}, Entropy ${entropy.toFixed(4)} N=${elements} lines = ${lineMark} `;
    document.getElementById('feedbackArea').value = feedBackTop + feedBackText + indetSample ;

    let entropyMark = 10.0 -  ( 7.0 * Math.sqrt( ((1.5845)** 2)  - ((entropy)**2)) )  ;

    document.getElementById('total').value = `Depth ${lineMark.toFixed(1)} out of 10  structure ${entropyMark.toFixed(3)} out of 10  ` ;

}
