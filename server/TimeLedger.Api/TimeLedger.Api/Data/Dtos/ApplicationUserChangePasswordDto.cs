using System.ComponentModel.DataAnnotations;

namespace TimeLedger.Api.Data.Dtos
{
	public class ApplicationUserChangePasswordDto
	{

		[Required]
		public string CurrentPassword { get; set; } = String.Empty;


		[Required]
		[MinLength(8)]
		[MaxLength(128)]
		public string NewPassword { get; set; } = String.Empty;
	}
}
